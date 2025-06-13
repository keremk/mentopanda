import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createHistoryEntry,
  getHistoryEntry,
  getTrainingHistory,
  updateHistoryEntry,
  deleteHistoryEntry,
} from "@/data/history";
import { createTraining } from "@/data/trainings";
import { createModule } from "@/data/modules";
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

describe("History Database Integration Tests", () => {
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

  it("CRUD as owner: user can create, read, update, and delete their own history", async () => {
    const { createdUsers, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "CRUD-Project" },
        { role: "member", projectName: "CRUD-Project" },
      ]);
    projectIds = createdProjectIds;
    userIds = createdUserIds;
    const admin = createdUsers.find((u) => u.role === "admin")!;
    const member = createdUsers.find((u) => u.role === "member")!;

    // 1. Admin creates a training and module
    const training = await createTraining(admin.supabase, {
      title: "CRUD Training",
    });
    const testModule = await createModule(admin.supabase, training.id, {
      title: "CRUD Module",
      instructions: "Test",
      modulePrompt: {
        aiModel: "openai",
        scenario: "",
        assessment: "",
        moderator: null,
        characters: [],
      },
      ordinal: 0,
    });

    // 2. Member creates a history entry
    const historyId = await createHistoryEntry(member.supabase, testModule.id);
    const entry = await getHistoryEntry(member.supabase, historyId);
    expect(entry).toBeDefined();
    expect(entry?.moduleId).toBe(testModule.id);

    // 3. Member updates the history entry
    await updateHistoryEntry(member.supabase, {
      id: historyId,
      assessmentText: "Updated Assessment",
    });
    const updatedEntry = await getHistoryEntry(member.supabase, historyId);
    expect(updatedEntry?.assessmentText).toBe("Updated Assessment");

    // 4. Member deletes the history entry
    await deleteHistoryEntry(member.supabase, historyId);
    const deletedEntry = await getHistoryEntry(member.supabase, historyId);
    expect(deletedEntry).toBeNull();
  });

  it("RLS: member cannot update or delete another member's history", async () => {
    const { createdUsers, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "RLS-Project" },
        { role: "member", projectName: "RLS-Project" },
        { role: "member", projectName: "RLS-Project" },
      ]);
    projectIds = createdProjectIds;
    userIds = createdUserIds;
    const admin = createdUsers.find((u) => u.role === "admin")!;
    const members = createdUsers.filter((u) => u.role === "member");
    const member1 = members[0]!;
    const member2 = members[1]!;

    // 1. Admin creates training & module
    const training = await createTraining(admin.supabase, {
      title: "RLS Training",
    });
    const testModule = await createModule(admin.supabase, training.id, {
      title: "RLS Module",
      instructions: "Test",
      modulePrompt: {
        aiModel: "openai",
        scenario: "",
        assessment: "",
        moderator: null,
        characters: [],
      },
      ordinal: 0,
    });

    // 2. Member 1 creates a history entry
    const historyId = await createHistoryEntry(member1.supabase, testModule.id);

    // 3. Member 2 attempts to update Member 1's history (should fail silently)
    await updateHistoryEntry(member2.supabase, {
      id: historyId,
      assessmentText: "Malicious Update",
    });

    // 4. Verify the update failed
    const entryAfterUpdate = await getHistoryEntry(member1.supabase, historyId);
    expect(entryAfterUpdate?.assessmentText).toBeNull();

    // 5. Member 2 attempts to delete Member 1's history (should fail silently)
    await deleteHistoryEntry(member2.supabase, historyId);

    // 6. Verify the delete failed
    const entryAfterDelete = await getHistoryEntry(member1.supabase, historyId);
    expect(entryAfterDelete).not.toBeNull();
  });

  it("RLS: admin can read all history in their current project", async () => {
    const { createdUsers, createdProjectIds, createdUserIds } =
      await setupTestEnvironment(adminSupabase, [
        { role: "admin", projectName: "Admin-Read-Project" },
        { role: "member", projectName: "Admin-Read-Project" },
      ]);
    projectIds = createdProjectIds;
    userIds = createdUserIds;
    const admin = createdUsers.find((u) => u.role === "admin")!;
    const member = createdUsers.find((u) => u.role === "member")!;

    // 1. Admin creates training & module
    const training = await createTraining(admin.supabase, {
      title: "Admin Read Training",
    });
    const testModule = await createModule(admin.supabase, training.id, {
      title: "Admin Read Module",
      instructions: "Test",
      modulePrompt: {
        aiModel: "openai",
        scenario: "",
        assessment: "",
        moderator: null,
        characters: [],
      },
      ordinal: 0,
    });

    // 2. Member creates a history entry
    const historyId = await createHistoryEntry(member.supabase, testModule.id);

    // 3. Admin fetches history for the member's user ID
    const { data, count } = await getTrainingHistory(
      admin.supabase,
      10,
      member.id
    );

    // 4. Verify admin can see the member's history
    expect(count).toBe(1);
    expect(data.some((h) => h.id === historyId)).toBe(true);
  });
});
