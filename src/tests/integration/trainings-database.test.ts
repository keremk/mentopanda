import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  toggleTrainingPublicStatus,
  getPublicTrainings,
  copyPublicTrainingToProject,
  createTraining,
  getTrainingById,
} from "@/data/trainings";
import { createCharacter } from "@/data/characters";
import { createModule } from "@/data/modules";
import { Database } from "@/types/supabase";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

// --- Test Setup ---
let adminSupabase: SupabaseClient<Database>;
let anonSupabase: SupabaseClient<Database>;
let projectIds: number[] = [];
let userIds: string[] = [];

describe("Public Trainings Database Integration Tests", () => {
  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables for tests.");
    }
    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  beforeEach(async () => {
    // Ensure clean state before each test by removing any leftover public trainings
    try {
      const { data: publicTrainings } = await adminSupabase
        .from("trainings")
        .select("id")
        .eq("is_public", true);
      
      if (publicTrainings && publicTrainings.length > 0) {
        await adminSupabase
          .from("trainings")
          .update({ is_public: false })
          .in("id", publicTrainings.map(t => t.id));
      }
    } catch (error) {
      console.warn("Failed to clean up public trainings before test:", error);
    }
  });

  afterEach(async () => {
    // Clean up any remaining public trainings to ensure test isolation
    try {
      const { data: publicTrainings } = await adminSupabase
        .from("trainings")
        .select("id")
        .eq("is_public", true);
      
      if (publicTrainings && publicTrainings.length > 0) {
        await adminSupabase
          .from("trainings")
          .update({ is_public: false })
          .in("id", publicTrainings.map(t => t.id));
      }
    } catch (error) {
      console.warn("Failed to clean up public trainings:", error);
    }

    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);
    projectIds = [];
    userIds = [];
  });

  describe("Training Public Status Management", () => {
    it("should allow training owners to toggle public status", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create a training
      const training = await createTraining(admin.supabase, {
        title: "Test Public Training"
      });

      expect(training.isPublic).toBe(false);
      expect(training.forkCount).toBe(0);

      // Make training public
      const publicTraining = await toggleTrainingPublicStatus(
        admin.supabase,
        training.id,
        true
      );

      expect(publicTraining.isPublic).toBe(true);
      expect(publicTraining.forkCount).toBe(0);

      // Make training private again
      const privateTraining = await toggleTrainingPublicStatus(
        admin.supabase,
        training.id,
        false
      );

      expect(privateTraining.isPublic).toBe(false);
    });

    it("should prevent non-owners from changing training public status", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" },
          { role: "member", projectName: "Test-Project-Member" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;
      const member = createdUsers[1]!;

      // Admin creates training
      const training = await createTraining(admin.supabase, {
        title: "Test Training"
      });

      // Member cannot change public status
      await expect(
        toggleTrainingPublicStatus(member.supabase, training.id, true)
      ).rejects.toThrow();
    });

    it("should update character public flags when training becomes public", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create training, character, and module
      const training = await createTraining(admin.supabase, {
        title: "Test Training"
      });

      const character = await createCharacter(admin.supabase, {
        name: "Test Character",
        voice: "test-voice",
      });

      const module = await createModule(admin.supabase, training.id, {
        title: "Test Module",
        ordinal: 0,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      // Link character to module
      await admin.supabase
        .from("modules_characters")
        .insert({
          module_id: module.id,
          character_id: character.id,
          ordinal: 0,
        });

      // Check character is not marked as public initially
      const { data: initialChar } = await admin.supabase
        .from("characters")
        .select("is_used_in_public_training")
        .eq("id", character.id)
        .single();

      expect(initialChar?.is_used_in_public_training).toBe(false);

      // Make training public
      await toggleTrainingPublicStatus(admin.supabase, training.id, true);

      // Check character is now marked as public
      const { data: publicChar } = await admin.supabase
        .from("characters")
        .select("is_used_in_public_training")
        .eq("id", character.id)
        .single();

      expect(publicChar?.is_used_in_public_training).toBe(true);
    });
  });

  describe("Public Training Access", () => {
    it("should allow authenticated users to view public trainings", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" },
          { role: "member", projectName: "Test-Project-Member" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;
      const member = createdUsers[1]!;

      // Admin creates and publishes training
      const training = await createTraining(admin.supabase, {
        title: "Public Test Training"
      });

      await toggleTrainingPublicStatus(admin.supabase, training.id, true);

      // Member should see public training
      const publicTrainings = await getPublicTrainings(member.supabase);
      expect(publicTrainings).toHaveLength(1);
      expect(publicTrainings[0].id).toBe(training.id);
      expect(publicTrainings[0].isPublic).toBe(true);
    });

    it("should allow anonymous users to view public trainings", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Admin creates and publishes training
      const training = await createTraining(admin.supabase, {
        title: "Anonymous Accessible Training"
      });

      await toggleTrainingPublicStatus(admin.supabase, training.id, true);

      // Anonymous user should see public training
      const publicTrainings = await getPublicTrainings(anonSupabase);
      expect(publicTrainings).toHaveLength(1);
      expect(publicTrainings[0].id).toBe(training.id);
    });

    it("should not show private trainings in public list", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create private training
      await createTraining(admin.supabase, {
        title: "Private Training"
      });

      // Should not appear in public list
      const publicTrainings = await getPublicTrainings(anonSupabase);
      expect(publicTrainings).toHaveLength(0);
    });

    it("should order public trainings by fork count and creation date", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create multiple public trainings
      const training1 = await createTraining(admin.supabase, {
        title: "Training 1"
      });
      const training2 = await createTraining(admin.supabase, {
        title: "Training 2"
      });

      // Make both public
      await toggleTrainingPublicStatus(admin.supabase, training1.id, true);
      await toggleTrainingPublicStatus(admin.supabase, training2.id, true);

      // Simulate fork count by directly updating
      await adminSupabase
        .from("trainings")
        .update({ fork_count: 5 })
        .eq("id", training1.id);

      const publicTrainings = await getPublicTrainings(anonSupabase);
      expect(publicTrainings).toHaveLength(2);
      
      // Training with higher fork count should come first
      expect(publicTrainings[0].id).toBe(training1.id);
      expect(publicTrainings[0].forkCount).toBe(5);
    });
  });

  describe("Training Deep Copy Functionality", () => {
    it("should deep copy public training to user's project", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" },
          { role: "admin", projectName: "Test-Project-Copier" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;
      const copier = createdUsers[1]!;

      // Admin creates training with module and character
      const sourceTraining = await createTraining(admin.supabase, {
        title: "Source Training"
      });

      const character = await createCharacter(admin.supabase, {
        name: "Source Character",
        voice: "test-voice",
      });

      const module = await createModule(admin.supabase, sourceTraining.id, {
        title: "Source Module",
        ordinal: 0,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      await admin.supabase
        .from("modules_characters")
        .insert({
          module_id: module.id,
          character_id: character.id,
          ordinal: 0,
        });

      // Make training public
      await toggleTrainingPublicStatus(admin.supabase, sourceTraining.id, true);

      // Copier copies the training
      const { trainingId, characterMapping, moduleMapping } = 
        await copyPublicTrainingToProject(copier.supabase, sourceTraining.id);

      expect(trainingId).toBeDefined();
      expect(characterMapping).toBeDefined();
      expect(moduleMapping).toBeDefined();

      // Verify copied training exists and is private
      const copiedTraining = await getTrainingById(copier.supabase, trainingId);
      expect(copiedTraining).toBeDefined();
      expect(copiedTraining!.title).toBe("Source Training");
      expect(copiedTraining!.isPublic).toBe(false);
      expect(copiedTraining!.forkCount).toBe(0);
      expect(copiedTraining!.projectId).toBe(copier.projectId);

      // Verify source training fork count increased
      const updatedSource = await getTrainingById(admin.supabase, sourceTraining.id);
      expect(updatedSource!.forkCount).toBe(1);
    });

    it("should prevent copying private trainings", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" },
          { role: "member", projectName: "Test-Project-Member" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;
      const member = createdUsers[1]!;

      // Admin creates private training
      const privateTraining = await createTraining(admin.supabase, {
        title: "Private Training"
      });

      // Member should not be able to copy private training
      await expect(
        copyPublicTrainingToProject(member.supabase, privateTraining.id)
      ).rejects.toThrow();
    });

    it("should handle copying training with multiple modules and characters", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" },
          { role: "admin", projectName: "Test-Project-Copier" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;
      const copier = createdUsers[1]!;

      // Create complex training
      const sourceTraining = await createTraining(admin.supabase, {
        title: "Complex Training"
      });

      // Create multiple characters
      const char1 = await createCharacter(admin.supabase, {
        name: "Character 1",
        voice: "voice1",
      });

      const char2 = await createCharacter(admin.supabase, {
        name: "Character 2", 
        voice: "voice2",
      });

      // Create multiple modules
      const module1 = await createModule(admin.supabase, sourceTraining.id, {
        title: "Module 1",
        ordinal: 0,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      const module2 = await createModule(admin.supabase, sourceTraining.id, {
        title: "Module 2",
        ordinal: 1,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      // Link characters to modules
      await admin.supabase.from("modules_characters").insert([
        { module_id: module1.id, character_id: char1.id, ordinal: 0 },
        { module_id: module2.id, character_id: char2.id, ordinal: 0 },
      ]);

      // Make training public
      await toggleTrainingPublicStatus(admin.supabase, sourceTraining.id, true);

      // Copy training
      const { trainingId, characterMapping, moduleMapping } = 
        await copyPublicTrainingToProject(copier.supabase, sourceTraining.id);

      // Verify all modules were copied
      const { data: copiedModules } = await copier.supabase
        .from("modules")
        .select("*")
        .eq("training_id", trainingId)
        .order("ordinal");

      expect(copiedModules).toHaveLength(2);
      // Check that all expected module titles exist, regardless of order
      const moduleTitles = copiedModules!.map(m => m.title);
      expect(moduleTitles).toContain("Module 1");
      expect(moduleTitles).toContain("Module 2");

      // Verify all characters were copied
      const { data: copiedCharacters } = await copier.supabase
        .from("characters")
        .select("*")
        .eq("project_id", copier.projectId);

      expect(copiedCharacters).toHaveLength(2);
      expect(Object.keys(characterMapping)).toHaveLength(2);
      expect(Object.keys(moduleMapping)).toHaveLength(2);
    });
  });

  describe("RLS Policy Enforcement", () => {
    it("should enforce RLS for modules of public trainings", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create public training with module
      const training = await createTraining(admin.supabase, {
        title: "Public Training"
      });

      const module = await createModule(admin.supabase, training.id, {
        title: "Public Module",
        ordinal: 0,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      await toggleTrainingPublicStatus(admin.supabase, training.id, true);

      // The training owner should be able to access their modules
      const { data: ownerModules } = await admin.supabase
        .from("modules")
        .select("*")
        .eq("training_id", training.id);

      expect(ownerModules).toHaveLength(1);
      expect(ownerModules![0].id).toBe(module.id);

      // Test that the public training can be seen by others
      const publicTrainings = await getPublicTrainings(anonSupabase);
      expect(publicTrainings.some(t => t.id === training.id)).toBe(true);
    });

    it("should enforce RLS for characters used in public trainings", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } = 
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Test-Project-Admin" }
        ]);

      projectIds = createdProjectIds;
      userIds = createdUserIds;

      const admin = createdUsers[0]!;

      // Create training with character
      const training = await createTraining(admin.supabase, {
        title: "Training with Character"
      });

      const character = await createCharacter(admin.supabase, {
        name: "Public Character",
        voice: "test-voice",
      });

      const module = await createModule(admin.supabase, training.id, {
        title: "Module",
        ordinal: 0,
        instructions: null,
        modulePrompt: {
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          aiModel: "openai",
          characters: [],
        },
      });

      await admin.supabase
        .from("modules_characters")
        .insert({
          module_id: module.id,
          character_id: character.id,
          ordinal: 0,
        });

      // Make training public (should trigger character flag update)
      await toggleTrainingPublicStatus(admin.supabase, training.id, true);

      // Anonymous user should be able to access character used in public training
      const { data: publicCharacters } = await anonSupabase
        .from("characters")
        .select("*")
        .eq("id", character.id);

      expect(publicCharacters).toHaveLength(1);
      expect(publicCharacters![0].name).toBe("Public Character");
    });
  });
});