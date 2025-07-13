import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getTrainingNote,
  createTrainingNote,
  updateTrainingNote,
  deleteTrainingNote,
  upsertTrainingNote,
  appendToDraft,
  resetDraft,
  type CreateTrainingNoteInput,
  type UpdateTrainingNoteInput,
} from "@/data/training-notes";
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
let testTrainingNoteIds: Array<{ moduleId: number; userId: string }> = [];

// --- Vitest Lifecycle Hooks ---

describe("Training Notes Database Integration Tests", () => {
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
    // Manually clean up training notes
    if (testTrainingNoteIds.length > 0) {
      for (const { moduleId, userId } of testTrainingNoteIds) {
        await adminSupabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("training_notes" as any)
          .delete()
          .eq("module_id", moduleId)
          .eq("user_id", userId);
      }
    }
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);
    projectIds = [];
    userIds = [];
    testTrainingNoteIds = [];
  });

  // --- Test Cases ---

  describe("CRUD Operations", () => {
    it("should create, read, update, and delete training notes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "CRUD-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // 1. Create a training and module for testing
      const training = await createTraining(user.supabase, {
        title: "CRUD Training",
      });
      const testModule = await createModule(user.supabase, training.id, {
        title: "CRUD Module",
        instructions: "Test instructions",
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

      // 2. Create a training note
      const createInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Initial notes",
      };
      const createdNote = await createTrainingNote(user.supabase, createInput);
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: user.id });

      expect(createdNote).toBeDefined();
      expect(createdNote.moduleId).toBe(testModule.id);
      expect(createdNote.userId).toBe(user.id);
      expect(createdNote.notes).toBe("Initial notes");
      expect(createdNote.draft).toBeNull();

      // 3. Read the training note
      const retrievedNote = await getTrainingNote(user.supabase, testModule.id);
      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.notes).toBe("Initial notes");

      // 4. Update the training note
      const updateInput: UpdateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Updated notes",
      };
      const updatedNote = await updateTrainingNote(user.supabase, updateInput);
      expect(updatedNote.notes).toBe("Updated notes");

      // 5. Delete the training note
      await deleteTrainingNote(user.supabase, testModule.id);
      const deletedNote = await getTrainingNote(user.supabase, testModule.id);
      expect(deletedNote).toBeNull();
    });

    it("should handle upsert operation for training notes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Upsert-Notes-Project" },
          { role: "member", projectName: "Upsert-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const user = createdUsers.find((u) => u.role === "member")!;

      // Create a training and module (admin creates, user uses)
      const training = await createTraining(admin.supabase, {
        title: "Upsert Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "Upsert Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // 1. Upsert when note doesn't exist (should create)
      const upsertInput1: UpdateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "First upsert",
      };
      const upsertedNote1 = await upsertTrainingNote(
        user.supabase,
        upsertInput1
      );
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: user.id });

      expect(upsertedNote1.notes).toBe("First upsert");

      // 2. Upsert when note exists (should update)
      const upsertInput2: UpdateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Second upsert",
      };
      const upsertedNote2 = await upsertTrainingNote(
        user.supabase,
        upsertInput2
      );
      expect(upsertedNote2.notes).toBe("Second upsert");

      // Verify only one note exists
      const retrievedNote = await getTrainingNote(user.supabase, testModule.id);
      expect(retrievedNote!.notes).toBe("Second upsert");
    });

    it("should return null when getting non-existent training note", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Non-Existent-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const nonExistentNote = await getTrainingNote(user.supabase, 99999);
      expect(nonExistentNote).toBeNull();
    });
  });

  describe("Draft Functionality", () => {
    it("should append to draft and reset draft correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Draft-Notes-Project" },
          { role: "member", projectName: "Draft-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const user = createdUsers.find((u) => u.role === "member")!;

      // Create a training and module (admin creates, user uses)
      const training = await createTraining(admin.supabase, {
        title: "Draft Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "Draft Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // 1. Reset draft (should create entry with null draft)
      await resetDraft(user.supabase, testModule.id);
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: user.id });

      let note = await getTrainingNote(user.supabase, testModule.id);
      expect(note).toBeDefined();
      expect(note!.draft).toBeNull();

      // 2. Append to draft (first append)
      await appendToDraft(user.supabase, testModule.id, "First line\n");
      note = await getTrainingNote(user.supabase, testModule.id);
      expect(note!.draft).toBe("First line\n");

      // 3. Append to draft (second append)
      await appendToDraft(user.supabase, testModule.id, "Second line\n");
      note = await getTrainingNote(user.supabase, testModule.id);
      expect(note!.draft).toBe("First line\nSecond line\n");

      // 4. Append to draft (third append)
      await appendToDraft(user.supabase, testModule.id, "Third line");
      note = await getTrainingNote(user.supabase, testModule.id);
      expect(note!.draft).toBe("First line\nSecond line\nThird line");

      // 5. Reset draft
      await resetDraft(user.supabase, testModule.id);
      note = await getTrainingNote(user.supabase, testModule.id);
      expect(note!.draft).toBeNull();
    });

    it("should append to draft for non-existent note (should create)", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Draft-Create-Notes-Project" },
          { role: "member", projectName: "Draft-Create-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const user = createdUsers.find((u) => u.role === "member")!;

      // Create a training and module (admin creates, user uses)
      const training = await createTraining(admin.supabase, {
        title: "Draft Create Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "Draft Create Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Append to draft when no note exists
      const result = await appendToDraft(
        user.supabase,
        testModule.id,
        "New draft content"
      );
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: user.id });

      expect(result.draft).toBe("New draft content");
      expect(result.notes).toBeNull();

      // Verify the note was created
      const note = await getTrainingNote(user.supabase, testModule.id);
      expect(note!.draft).toBe("New draft content");
    });
  });

  describe("RLS Policy Tests", () => {
    it("should only allow users to access their own training notes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "RLS-Notes-Project" },
          { role: "member", projectName: "RLS-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const member = createdUsers.find((u) => u.role === "member")!;

      // Admin creates a training and module
      const training = await createTraining(admin.supabase, {
        title: "RLS Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "RLS Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Member creates a training note
      const memberCreateInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Member's private notes",
      };
      await createTrainingNote(member.supabase, memberCreateInput);
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: member.id });

      // Admin should not be able to see member's notes
      const adminRetrievedNote = await getTrainingNote(
        admin.supabase,
        testModule.id
      );
      expect(adminRetrievedNote).toBeNull();

      // Member should be able to see their own notes
      const memberRetrievedNote = await getTrainingNote(
        member.supabase,
        testModule.id
      );
      expect(memberRetrievedNote).toBeDefined();
      expect(memberRetrievedNote!.notes).toBe("Member's private notes");
    });

    it("should not allow users to update other users' training notes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "RLS-Update-Notes-Project" },
          { role: "member", projectName: "RLS-Update-Notes-Project" },
          { role: "member", projectName: "RLS-Update-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const member1 = createdUsers.find(
        (u, i) => u.role === "member" && i === 1
      )!;
      const member2 = createdUsers.find(
        (u, i) => u.role === "member" && i === 2
      )!;

      // Admin creates a training and module
      const training = await createTraining(admin.supabase, {
        title: "RLS Update Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "RLS Update Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Member1 creates a training note
      const createInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Member1's notes",
      };
      await createTrainingNote(member1.supabase, createInput);
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: member1.id });

      // Member2 attempts to update Member1's notes (should fail silently)
      const maliciousUpdate: UpdateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Malicious update by member2",
      };
      await expect(
        updateTrainingNote(member2.supabase, maliciousUpdate)
      ).rejects.toThrow();

      // Verify the original notes are unchanged
      const originalNote = await getTrainingNote(
        member1.supabase,
        testModule.id
      );
      expect(originalNote!.notes).toBe("Member1's notes");
    });

    it("should not allow users to delete other users' training notes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "RLS-Delete-Notes-Project" },
          { role: "member", projectName: "RLS-Delete-Notes-Project" },
          { role: "member", projectName: "RLS-Delete-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const member1 = createdUsers.find(
        (u, i) => u.role === "member" && i === 1
      )!;
      const member2 = createdUsers.find(
        (u, i) => u.role === "member" && i === 2
      )!;

      // Admin creates a training and module
      const training = await createTraining(admin.supabase, {
        title: "RLS Delete Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "RLS Delete Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Member1 creates a training note
      const createInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Member1's notes",
      };
      await createTrainingNote(member1.supabase, createInput);
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: member1.id });

      // Member2 attempts to delete Member1's notes (should fail silently)
      await deleteTrainingNote(member2.supabase, testModule.id);

      // Verify the notes still exist
      const stillExistingNote = await getTrainingNote(
        member1.supabase,
        testModule.id
      );
      expect(stillExistingNote).toBeDefined();
      expect(stillExistingNote!.notes).toBe("Member1's notes");
    });

    it("should not allow users to append to other users' drafts", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "RLS-Draft-Notes-Project" },
          { role: "member", projectName: "RLS-Draft-Notes-Project" },
          { role: "member", projectName: "RLS-Draft-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const member1 = createdUsers.find(
        (u, i) => u.role === "member" && i === 1
      )!;
      const member2 = createdUsers.find(
        (u, i) => u.role === "member" && i === 2
      )!;

      // Admin creates a training and module
      const training = await createTraining(admin.supabase, {
        title: "RLS Draft Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "RLS Draft Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Member1 creates a draft
      await appendToDraft(member1.supabase, testModule.id, "Member1's draft");
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: member1.id });

      // Member2 attempts to append to Member1's draft (should create their own)
      await appendToDraft(member2.supabase, testModule.id, "Member2's draft");
      testTrainingNoteIds.push({ moduleId: testModule.id, userId: member2.id });

      // Verify Member1's draft is unchanged
      const member1Note = await getTrainingNote(
        member1.supabase,
        testModule.id
      );
      expect(member1Note!.draft).toBe("Member1's draft");

      // Verify Member2 has their own separate draft
      const member2Note = await getTrainingNote(
        member2.supabase,
        testModule.id
      );
      expect(member2Note!.draft).toBe("Member2's draft");
    });
  });

  describe("Database Constraints", () => {
    it("should handle cascade delete when module is deleted", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "Cascade-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers[0]!;

      // Create a training and module
      const training = await createTraining(admin.supabase, {
        title: "Cascade Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "Cascade Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Create a training note
      const createInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Notes that should be deleted",
      };
      await createTrainingNote(admin.supabase, createInput);

      // Verify note exists
      let note = await getTrainingNote(admin.supabase, testModule.id);
      expect(note).toBeDefined();

      // Delete the module (this should cascade delete the note)
      await adminSupabase.from("modules").delete().eq("id", testModule.id);

      // Verify note is automatically deleted due to foreign key constraint
      note = await getTrainingNote(admin.supabase, testModule.id);
      expect(note).toBeNull();
    });

    it("should handle cascade delete when user profile is deleted", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "admin", projectName: "User-Cascade-Notes-Project" },
          { role: "member", projectName: "User-Cascade-Notes-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const admin = createdUsers.find((u) => u.role === "admin")!;
      const member = createdUsers.find((u) => u.role === "member")!;

      // Admin creates a training and module
      const training = await createTraining(admin.supabase, {
        title: "User Cascade Training",
      });
      const testModule = await createModule(admin.supabase, training.id, {
        title: "User Cascade Module",
        instructions: "Test instructions",
        modulePrompt: {
          aiModel: "openai",
          scenario: "Test scenario",
          assessment: "",
          moderator: null,
          prepCoach: null,
          characters: [],
        },
        ordinal: 0,
      });

      // Member creates a training note
      const createInput: CreateTrainingNoteInput = {
        moduleId: testModule.id,
        notes: "Member's notes that should be deleted",
      };
      await createTrainingNote(member.supabase, createInput);

      // Verify note exists (admin can't see it due to RLS)
      const memberNote = await getTrainingNote(member.supabase, testModule.id);
      expect(memberNote).toBeDefined();

      // Delete the member's profile (this should cascade delete their notes)
      await adminSupabase.from("profiles").delete().eq("id", member.id);

      // Note should be automatically deleted due to foreign key constraint
      // We can verify this by checking the database directly
      const { data: notesInDb } = await adminSupabase
        .from("training_notes")
        .select("*")
        .eq("module_id", testModule.id)
        .eq("user_id", member.id);

      expect(notesInDb).toHaveLength(0);
    });
  });
});
