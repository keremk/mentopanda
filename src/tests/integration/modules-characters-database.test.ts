import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  insertModuleCharacter,
  updateModuleCharacterPrompt,
  updateModuleCharacterAttributes,
  type InsertModuleCharacterInput,
  type UpdateModuleCharacterPromptInput,
  type UpdateModuleCharacterAttributesInput,
} from "@/data/modules-characters";
import { createModule } from "@/data/modules";
import { createTraining } from "@/data/trainings";
import { createCharacter } from "@/data/characters";
import { Database } from "@/types/supabase";
import { Skills, Emotions, createDefaultSkills, createDefaultEmotions } from "@/types/character-attributes";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

// --- Test Setup ---
let adminSupabase: SupabaseClient<Database>;
let projectIds: number[] = [];
let userIds: string[] = [];

// --- Vitest Lifecycle Hooks ---

describe("Modules Characters Database Integration Tests", () => {
  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables for tests.");
    }
    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterEach(async () => {
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);
    projectIds = [];
    userIds = [];
  });

  // --- Helper Functions ---

  async function createTestData(userSupabase: SupabaseClient) {
    // Create training
    const training = await createTraining(userSupabase, {
      title: "Test Training",
    });

    // Create module
    const moduleInTest = await createModule(userSupabase, training.id, {
      title: "Test Module",
      instructions: "Test module instructions",
      modulePrompt: {
        aiModel: "openai",
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
      ordinal: 0,
    });

    // Create character
    const character = await createCharacter(userSupabase, {
      name: "Test Character",
      voice: "alloy",
    });

    return { training, module: moduleInTest, character };
  }

  // --- Test Cases ---

  describe("insertModuleCharacter", () => {
    it("should successfully insert a module-character relationship with default skills and emotions", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "ModuleCharacter-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      const insertData: InsertModuleCharacterInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Test prompt",
      };

      // Should not throw an error
      await expect(
        insertModuleCharacter(user.supabase, insertData)
      ).resolves.not.toThrow();

      // Verify the relationship was created with default values
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("ordinal, prompt, skills, emotion")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters).toBeTruthy();
      expect(moduleCharacters!.ordinal).toBe(1);
      expect(moduleCharacters!.prompt).toBe("Test prompt");
      
      // Check that default skills and emotions were set
      expect(moduleCharacters!.skills).toEqual(createDefaultSkills());
      expect(moduleCharacters!.emotion).toEqual(createDefaultEmotions());
    });

    it("should insert module-character with custom skills and emotions", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "CustomAttributes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      const customSkills: Skills = {
        EQ: 0.8,
        Clarity: 0.6,
        Strategy: 0.9,
        Negotiation: 0.7,
        Facilitation: 0.5,
      };

      const customEmotions: Emotions = {
        Neutral: 0.1,
        Supportive: 0.9,
        Enthusiastic: 0.8,
        Concerned: 0.2,
        Frustrated: 0.0,
      };

      const insertData: InsertModuleCharacterInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 2,
        prompt: "Custom prompt",
        skills: customSkills,
        emotion: customEmotions,
      };

      await insertModuleCharacter(user.supabase, insertData);

      // Verify the relationship was created with custom values
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("skills, emotion")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters).toBeTruthy();
      expect(moduleCharacters!.skills).toEqual(customSkills);
      expect(moduleCharacters!.emotion).toEqual(customEmotions);
    });

    it("should prevent users from adding characters to modules in other projects (RLS)", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "User1-Project" },
          { role: "admin", projectName: "User2-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      // User 1 creates module and character
      const { module: moduleInTest } = await createTestData(user1.supabase);

      // User 2 tries to link their character to User 1's module
      const user2Character = await createCharacter(user2.supabase, {
        name: "User2 Character",
        voice: "alloy",
      });

      const insertData: InsertModuleCharacterInput = {
        moduleId: moduleInTest.id, // User 1's module
        characterId: user2Character.id, // User 2's character
        ordinal: 1,
        prompt: "Should fail",
      };

      // Should fail due to RLS
      await expect(
        insertModuleCharacter(user2.supabase, insertData)
      ).rejects.toThrow();
    });
  });

  describe("updateModuleCharacterPrompt", () => {
    it("should successfully update the prompt for a module-character relationship", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "UpdatePrompt-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      // First insert the relationship
      await insertModuleCharacter(user.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Original prompt",
      });

      // Update the prompt
      const updateData: UpdateModuleCharacterPromptInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        prompt: "Updated prompt",
      };

      await updateModuleCharacterPrompt(user.supabase, updateData);

      // Verify the prompt was updated
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("prompt, updated_at")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters!.prompt).toBe("Updated prompt");
      expect(new Date(moduleCharacters!.updated_at!)).toBeInstanceOf(Date);
    });

    it("should prevent users from updating prompts in other projects (RLS)", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "User1-Project" },
          { role: "member", projectName: "User2-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      const { module: moduleInTest, character } = await createTestData(user1.supabase);

      // User 1 creates the relationship
      await insertModuleCharacter(user1.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Original prompt",
      });

      // User 2 tries to update User 1's module-character prompt
      const updateData: UpdateModuleCharacterPromptInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        prompt: "Hacked prompt",
      };

      // Should silently fail (no rows updated) due to RLS, not throw an error
      await expect(
        updateModuleCharacterPrompt(user2.supabase, updateData)
      ).resolves.not.toThrow();
      
      // Verify the prompt was NOT updated (still original value)
      const { data: moduleCharacters } = await user1.supabase
        .from("modules_characters")
        .select("prompt")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();
      
      expect(moduleCharacters!.prompt).toBe("Original prompt");
    });
  });

  describe("updateModuleCharacterAttributes", () => {
    it("should successfully update skills only", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "UpdateSkills-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      // First insert the relationship
      await insertModuleCharacter(user.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Test prompt",
      });

      // Update only skills
      const newSkills: Skills = {
        EQ: 0.9,
        Clarity: 0.8,
        Strategy: 0.7,
        Negotiation: 0.6,
        Facilitation: 0.5,
      };

      const updateData: UpdateModuleCharacterAttributesInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        skills: newSkills,
      };

      await updateModuleCharacterAttributes(user.supabase, updateData);

      // Verify only skills were updated, emotions remain default
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("skills, emotion, updated_at")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters!.skills).toEqual(newSkills);
      expect(moduleCharacters!.emotion).toEqual(createDefaultEmotions());
      expect(new Date(moduleCharacters!.updated_at!)).toBeInstanceOf(Date);
    });

    it("should successfully update emotions only", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "UpdateEmotions-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      // First insert the relationship
      await insertModuleCharacter(user.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Test prompt",
      });

      // Update only emotions
      const newEmotions: Emotions = {
        Neutral: 0.1,
        Supportive: 0.2,
        Enthusiastic: 0.9,
        Concerned: 0.8,
        Frustrated: 0.7,
      };

      const updateData: UpdateModuleCharacterAttributesInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        emotion: newEmotions,
      };

      await updateModuleCharacterAttributes(user.supabase, updateData);

      // Verify only emotions were updated, skills remain default
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("skills, emotion, updated_at")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters!.skills).toEqual(createDefaultSkills());
      expect(moduleCharacters!.emotion).toEqual(newEmotions);
    });

    it("should successfully update both skills and emotions", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "UpdateBoth-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      // First insert the relationship
      await insertModuleCharacter(user.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Test prompt",
      });

      // Update both skills and emotions
      const newSkills: Skills = {
        EQ: 0.9,
        Clarity: 0.8,
        Strategy: 0.7,
        Negotiation: 0.6,
        Facilitation: 0.5,
      };

      const newEmotions: Emotions = {
        Neutral: 0.1,
        Supportive: 0.2,
        Enthusiastic: 0.9,
        Concerned: 0.8,
        Frustrated: 0.7,
      };

      const updateData: UpdateModuleCharacterAttributesInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        skills: newSkills,
        emotion: newEmotions,
      };

      await updateModuleCharacterAttributes(user.supabase, updateData);

      // Verify both were updated
      const { data: moduleCharacters, error } = await user.supabase
        .from("modules_characters")
        .select("skills, emotion, updated_at")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();

      expect(error).toBeNull();
      expect(moduleCharacters!.skills).toEqual(newSkills);
      expect(moduleCharacters!.emotion).toEqual(newEmotions);
    });

    it("should prevent users from updating attributes in other projects (RLS)", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "User1-Project" },
          { role: "member", projectName: "User2-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      const { module: moduleInTest, character } = await createTestData(user1.supabase);

      // User 1 creates the relationship
      await insertModuleCharacter(user1.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Original prompt",
      });

      // User 2 tries to update User 1's module-character attributes
      const updateData: UpdateModuleCharacterAttributesInput = {
        moduleId: moduleInTest.id,
        characterId: character.id,
        skills: {
          EQ: 1.0,
          Clarity: 1.0,
          Strategy: 1.0,
          Negotiation: 1.0,
          Facilitation: 1.0,
        },
      };

      // Should silently fail (no rows updated) due to RLS, not throw an error
      await expect(
        updateModuleCharacterAttributes(user2.supabase, updateData)
      ).resolves.not.toThrow();
      
      // Verify the attributes were NOT updated (still default values)
      const { data: moduleCharacters } = await user1.supabase
        .from("modules_characters")
        .select("skills")
        .eq("module_id", moduleInTest.id)
        .eq("character_id", character.id)
        .single();
      
      expect(moduleCharacters!.skills).toEqual(createDefaultSkills());
    });
  });

  describe("Database Constraints", () => {
    it("should enforce foreign key constraints for module_id", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Constraints-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { character } = await createTestData(user.supabase);

      const insertData: InsertModuleCharacterInput = {
        moduleId: 999999, // Non-existent module
        characterId: character.id,
        ordinal: 1,
        prompt: "Should fail",
      };

      // Should fail due to foreign key constraint
      await expect(
        insertModuleCharacter(user.supabase, insertData)
      ).rejects.toThrow();
    });

    it("should enforce foreign key constraints for character_id", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Constraints-Project2" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest } = await createTestData(user.supabase);

      const insertData: InsertModuleCharacterInput = {
        moduleId: moduleInTest.id,
        characterId: 999999, // Non-existent character
        ordinal: 1,
        prompt: "Should fail",
      };

      // Should fail due to foreign key constraint
      await expect(
        insertModuleCharacter(user.supabase, insertData)
      ).rejects.toThrow();
    });

    it("should handle cascade deletion when module is deleted", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Cascade-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { module: moduleInTest, character } = await createTestData(user.supabase);

      // Create module-character relationship
      await insertModuleCharacter(user.supabase, {
        moduleId: moduleInTest.id,
        characterId: character.id,
        ordinal: 1,
        prompt: "Test prompt",
      });

      // Verify relationship exists
      const { data: beforeDelete } = await user.supabase
        .from("modules_characters")
        .select("*")
        .eq("module_id", moduleInTest.id);
      expect(beforeDelete).toHaveLength(1);

      // Delete the module
      await user.supabase
        .from("modules")
        .delete()
        .eq("id", moduleInTest.id);

      // Verify relationship was cascaded
      const { data: afterDelete } = await user.supabase
        .from("modules_characters")
        .select("*")
        .eq("module_id", moduleInTest.id);
      expect(afterDelete).toHaveLength(0);
    });
  });
});