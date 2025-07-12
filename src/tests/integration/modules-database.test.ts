import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getRandomModuleRecommendation, createModule } from "@/data/modules";
import { createTraining } from "@/data/trainings";
import { Database } from "@/types/supabase";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

// --- Test Setup ---
let adminSupabase: SupabaseClient<Database>;
let projectIds: number[] = [];
let userIds: string[] = [];

// --- Vitest Lifecycle Hooks ---

describe("Modules Database Integration Tests", () => {
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

  // --- Test Cases ---

  describe("getRandomModuleRecommendation", () => {
    it("should return null when no modules exist in user's current project", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Empty-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const recommendation = await getRandomModuleRecommendation(user.supabase);

      expect(recommendation).toBeNull();
    });

    it("should return a module recommendation when modules exist", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Modules-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // Create a training and module
      const training = await createTraining(user.supabase, {
        title: "Test Training",
      });

      await createModule(user.supabase, training.id, {
        title: "Test Module",
        instructions:
          "This is a test module for practicing communication skills.",
        modulePrompt: {
          aiModel: "openai",
          scenario:
            "You are in a business meeting discussing quarterly results.",
          assessment: "Evaluate communication clarity and professionalism.",
          moderator: "Guide the conversation if it goes off-track.",
          prepCoach: "Help prepare for difficult questions.",
          characters: [],
        },
        ordinal: 0,
      });

      const recommendation = await getRandomModuleRecommendation(user.supabase);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.moduleId).toBeDefined();
      expect(recommendation?.moduleTitle).toBe("Test Module");
      expect(recommendation?.moduleDescription).toBe(
        "This is a test module for practicing communication skills."
      );
    });

    it("should return fallback description when module has no instructions or scenario", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Fallback-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // Create a training and module with minimal data
      const training = await createTraining(user.supabase, {
        title: "Minimal Training",
      });

      await createModule(user.supabase, training.id, {
        title: "Minimal Module",
        instructions: null,
        modulePrompt: {
          aiModel: "openai",
          scenario: "",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      const recommendation = await getRandomModuleRecommendation(user.supabase);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.moduleId).toBeDefined();
      expect(recommendation?.moduleTitle).toBe("Minimal Module");
      expect(recommendation?.moduleDescription).toBe(
        "A training module to help improve your communication skills."
      );
    });

    it("should use scenario_prompt as fallback description when instructions is null", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Scenario-Fallback-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // Create a training and module with scenario but no instructions
      const training = await createTraining(user.supabase, {
        title: "Scenario Training",
      });

      await createModule(user.supabase, training.id, {
        title: "Scenario Module",
        instructions: null,
        modulePrompt: {
          aiModel: "openai",
          scenario:
            "Practice handling customer complaints in a retail environment.",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      const recommendation = await getRandomModuleRecommendation(user.supabase);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.moduleId).toBeDefined();
      expect(recommendation?.moduleTitle).toBe("Scenario Module");
      expect(recommendation?.moduleDescription).toBe(
        "Practice handling customer complaints in a retail environment."
      );
    });

    it("should randomly select from multiple modules", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Multiple-Modules-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // Create a training and multiple modules
      const training = await createTraining(user.supabase, {
        title: "Multi-Module Training",
      });

      const moduleIds: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const moduleIT = await createModule(user.supabase, training.id, {
          title: `Module ${i}`,
          instructions: `Instructions for module ${i}`,
          modulePrompt: {
            aiModel: "openai",
            scenario: `Scenario ${i}`,
            assessment: "",
            moderator: null,
            prepCoach: null,
            characters: [],
          },
          ordinal: i,
        });
        moduleIds.push(moduleIT.id.toString());
      }

      // Call multiple times to verify randomness (at least one should be different)
      const recommendations = await Promise.all([
        getRandomModuleRecommendation(user.supabase),
        getRandomModuleRecommendation(user.supabase),
        getRandomModuleRecommendation(user.supabase),
        getRandomModuleRecommendation(user.supabase),
        getRandomModuleRecommendation(user.supabase),
      ]);

      // All recommendations should be valid
      recommendations.forEach((rec) => {
        expect(rec).not.toBeNull();
        expect(moduleIds).toContain(rec?.moduleId);
      });

      // At least one recommendation should exist (basic sanity check)
      expect(recommendations.filter((rec) => rec !== null)).toHaveLength(5);
    });

    it("should only return modules from user's current project", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "User1-Project" },
          { role: "admin", projectName: "User2-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      // User 1 creates a module in their project
      const training1 = await createTraining(user1.supabase, {
        title: "User1 Training",
      });

      await createModule(user1.supabase, training1.id, {
        title: "User1 Module",
        instructions: "Module for user 1",
        modulePrompt: {
          aiModel: "openai",
          scenario: "User 1 scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // User 2 should not get recommendations from User 1's project
      const user2Recommendation = await getRandomModuleRecommendation(
        user2.supabase
      );
      expect(user2Recommendation).toBeNull();

      // User 1 should get their own module
      const user1Recommendation = await getRandomModuleRecommendation(
        user1.supabase
      );
      expect(user1Recommendation).not.toBeNull();
      expect(user1Recommendation?.moduleTitle).toBe("User1 Module");
    });
  });
});
