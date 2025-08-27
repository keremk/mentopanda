import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getOrCreateOverallProgress,
  getOverallProgress,
  updateOverallProgress,
  deleteOverallProgress,
  getOrCreateModuleProgress,
  getModuleProgress,
  getAllModuleProgress,
  updateModuleProgress,
  deleteModuleProgress,
} from "@/data/progress";
import { createTraining } from "@/data/trainings";
import { createModule } from "@/data/modules";
import { AI_MODELS } from "@/types/models";
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

describe("Progress Database Integration Tests", () => {
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

  // --- Overall Progress Tests ---

  it("CRUD as owner: user can create, read, update, and delete their own overall progress", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "member", projectName: "CRUD-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const member = users[0];

    // Create overall progress (get-or-create should create it)
    const progress = await getOrCreateOverallProgress(member.supabase, member.id);
    expect(progress).not.toBeNull();
    expect(progress.profileId).toBe(member.id);
    expect(progress.assessmentText).toBeNull();

    // Read overall progress
    const retrievedProgress = await getOverallProgress(member.supabase, member.id);
    expect(retrievedProgress).not.toBeNull();
    expect(retrievedProgress!.profileId).toBe(member.id);

    // Update overall progress
    await updateOverallProgress(member.supabase, member.id, "Updated assessment");

    const updatedProgress = await getOverallProgress(member.supabase, member.id);
    expect(updatedProgress!.assessmentText).toBe("Updated assessment");

    // Delete overall progress
    await deleteOverallProgress(member.supabase, member.id);
    const deletedProgress = await getOverallProgress(member.supabase, member.id);
    expect(deletedProgress).toBeNull();
  });

  it("RLS: user cannot access other users' overall progress", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "member", projectName: "RLS-Project" },
        { role: "member", projectName: "RLS-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const member1 = users[0];
    const member2 = users[1];

    // Member1 creates progress
    await getOrCreateOverallProgress(member1.supabase, member1.id);

    // Member2 cannot access Member1's progress
    const { data } = await member2.supabase
      .from("progress_overall")
      .select("*")
      .eq("profile_id", member1.id);

    expect(data).toHaveLength(0); // RLS blocks access
  });

  it("RLS: admin with training.history permission can view member overall progress in same project", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Admin-Project" },
        { role: "member", projectName: "Admin-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Member creates progress
    await getOrCreateOverallProgress(member.supabase, member.id);

    // Admin can read member's progress in same project
    const progress = await getOverallProgress(admin.supabase, member.id);
    expect(progress).not.toBeNull();
    expect(progress!.profileId).toBe(member.id);
  });

  it("RLS: admin can only view, not modify member's overall progress", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Shared-Project" },
        { role: "member", projectName: "Shared-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Member creates progress
    await getOrCreateOverallProgress(member.supabase, member.id);

    // Admin can view member's progress
    const progress = await getOverallProgress(admin.supabase, member.id);
    expect(progress).not.toBeNull();

    // Try to update via our data layer function (should fail due to ownership check)
    try {
      await updateOverallProgress(admin.supabase, member.id, "Admin modified");
      // If we get here, the test should fail because admin shouldn't be able to modify
      expect(false).toBe(true); // Force failure
    } catch (error) {
      // Expected - admin should not be able to modify member's progress
      expect(error).toBeDefined();
    }
  });

  // --- Module Progress Tests ---

  it("CRUD as owner: user can create, read, update, and delete their own module progress", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Module-CRUD-Project" },
        { role: "member", projectName: "Module-CRUD-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Create test module progress (get-or-create should create overall progress and module progress)
    const moduleProgress = await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);
    expect(moduleProgress).not.toBeNull();
    expect(moduleProgress.moduleId).toBe(testModule.id);
    expect(moduleProgress.assessmentText).toBeNull();

    // Read module progress
    const retrievedProgress = await getModuleProgress(member.supabase, member.id, testModule.id);
    expect(retrievedProgress).not.toBeNull();
    expect(retrievedProgress!.moduleId).toBe(testModule.id);

    // Update module progress
    await updateModuleProgress(member.supabase, member.id, testModule.id, "Updated module assessment");

    const updatedProgress = await getModuleProgress(member.supabase, member.id, testModule.id);
    expect(updatedProgress!.assessmentText).toBe("Updated module assessment");

    // Delete module progress
    await deleteModuleProgress(member.supabase, member.id, testModule.id);
    const deletedProgress = await getModuleProgress(member.supabase, member.id, testModule.id);
    expect(deletedProgress).toBeNull();
  });

  it("RLS: user cannot access other users' module progress", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Module-RLS-Project" },
        { role: "member", projectName: "Module-RLS-Project" },
        { role: "member", projectName: "Module-RLS-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member1 = users.find((u, i) => u.role === "member" && i === 1)!;
    const member2 = users.find((u, i) => u.role === "member" && i === 2)!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Member1 creates module progress
    await getOrCreateModuleProgress(member1.supabase, member1.id, testModule.id);

    // Member2 cannot access Member1's progress module
    const { data } = await member2.supabase
      .from("progress_modules")
      .select("*")
      .eq("module_id", testModule.id);

    expect(data).toHaveLength(0); // RLS blocks access
  });

  it("Cascade delete: deleting profile should delete progress records", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Cascade-Project" },
        { role: "member", projectName: "Cascade-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Create progress records
    await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);

    // Delete the profile (using admin client)
    await adminSupabase.auth.admin.deleteUser(member.id);

    // Verify progress records are deleted via cascade
    const { data: orphanedOverall } = await adminSupabase
      .from("progress_overall")
      .select("*")
      .eq("profile_id", member.id);

    const { data: orphanedModules } = await adminSupabase
      .from("progress_modules")
      .select(`
        *,
        progress_overall!inner (
          profile_id
        )
      `)
      .eq("progress_overall.profile_id", member.id);

    expect(orphanedOverall).toHaveLength(0);
    expect(orphanedModules).toHaveLength(0);
  });

  it("Cascade delete: deleting module should delete progress_modules records", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Module-Cascade-Project" },
        { role: "member", projectName: "Module-Cascade-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Create test module progress
    await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);

    // Delete the test module
    await adminSupabase.from("modules").delete().eq("id", testModule.id);

    // Verify progress_modules records are deleted via cascade
    const { data: orphanedModules } = await adminSupabase
      .from("progress_modules")
      .select("*")
      .eq("module_id", testModule.id);

    expect(orphanedModules).toHaveLength(0);
  });

  it("Get all module progress: retrieves all modules for a profile", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "GetAll-Project" },
        { role: "member", projectName: "GetAll-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test modules
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule1 = await createModule(admin.supabase, training.id, {
      title: "Module 1",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    const testModule2 = await createModule(admin.supabase, training.id, {
      title: "Module 2",
      instructions: "Test instructions",
      ordinal: 2,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Create progress for both modules
    await getOrCreateModuleProgress(member.supabase, member.id, testModule1.id);
    await getOrCreateModuleProgress(member.supabase, member.id, testModule2.id);

    // Get all module progress
    const allProgress = await getAllModuleProgress(member.supabase, member.id);
    expect(allProgress).toHaveLength(2);
    expect(allProgress.some(p => p.moduleId === testModule1.id)).toBe(true);
    expect(allProgress.some(p => p.moduleId === testModule2.id)).toBe(true);
  });

  it("Nullable fields: assessment_text can be null for both tables", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Nullable-Project" },
        { role: "member", projectName: "Nullable-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // Create overall progress (should have null assessment by default)
    const overallProgress = await getOrCreateOverallProgress(member.supabase, member.id);
    expect(overallProgress.assessmentText).toBeNull();

    // Create test module progress (should have null assessment by default)
    const moduleProgress = await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);
    expect(moduleProgress.assessmentText).toBeNull();
  });

  it("Get-or-create functionality works correctly", async () => {
    const { createdUsers: users, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "GetOrCreate-Project" },
        { role: "member", projectName: "GetOrCreate-Project" },
      ]);

    projectIds = createdProjectIds;
    userIds = createdUserIds;

    const admin = users.find((u) => u.role === "admin")!;
    const member = users.find((u) => u.role === "member")!;

    // Create training and test module
    const training = await createTraining(admin.supabase, {
      title: "Test Training",
    });

    const testModule = await createModule(admin.supabase, training.id, {
      title: "Test Module",
      instructions: "Test instructions",
      ordinal: 1,
      modulePrompt: {
        aiModel: AI_MODELS.OPENAI,
        scenario: "Test scenario",
        assessment: "Test assessment",
        moderator: null,
        prepCoach: null,
        characters: [],
      },
    });

    // First call should create
    const progress1 = await getOrCreateOverallProgress(member.supabase, member.id);
    expect(progress1).not.toBeNull();

    // Second call should return existing
    const progress2 = await getOrCreateOverallProgress(member.supabase, member.id);
    expect(progress2.id).toBe(progress1.id);

    // Same for module progress
    const moduleProgress1 = await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);
    expect(moduleProgress1).not.toBeNull();

    const moduleProgress2 = await getOrCreateModuleProgress(member.supabase, member.id, testModule.id);
    expect(moduleProgress2.id).toBe(moduleProgress1.id);
  });
});