import { describe, it, expect, beforeAll, afterEach, beforeEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  addToWaitingList,
  getWaitingListEntries,
  getWaitingListEntryById,
  deleteWaitingListEntry,
  checkEmailInWaitingList,
  type CreateWaitingListParams,
} from "@/data/waiting-list";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

describe("Waiting List Database Integration Tests", () => {
  let supabase: SupabaseClient; // For non-authenticated requests
  let adminSupabase: SupabaseClient; // For admin operations
  let testWaitingListIds: number[] = [];
  let projectIds: number[] = [];
  let userIds: string[] = [];
  let testCounter = 0;

  beforeAll(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterEach(async () => {
    // Manually clean up waiting list entries
    if (testWaitingListIds.length > 0) {
      await adminSupabase
        .from("waiting_list")
        .delete()
        .in("id", testWaitingListIds);
    }
    // General cleanup for users and projects
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);

    // Reset arrays
    testWaitingListIds = [];
    projectIds = [];
    userIds = [];
  });

  beforeEach(() => {
    testCounter++;
  });

  describe("Public Access (No Authentication Required)", () => {
    it("should allow anyone to add to waiting list", async () => {
      const params: CreateWaitingListParams = {
        email: `test-public-${testCounter}@example.com`,
        comment: "I'm excited!",
      };
      const entry = await addToWaitingList(supabase, params);
      expect(entry).toBeDefined();
      testWaitingListIds.push(entry.id);
    });

    it("should allow adding without comment", async () => {
      const params: CreateWaitingListParams = {
        email: `test-no-comment-${testCounter}@example.com`,
      };

      const entry = await addToWaitingList(supabase, params);

      expect(entry.email).toBe(params.email);
      expect(entry.comment).toBeNull();

      testWaitingListIds.push(entry.id);
    });

    it("should allow adding with null comment", async () => {
      const params: CreateWaitingListParams = {
        email: `test-null-comment-${testCounter}@example.com`,
        comment: null,
      };

      const entry = await addToWaitingList(supabase, params);

      expect(entry.email).toBe(params.email);
      expect(entry.comment).toBeNull();

      testWaitingListIds.push(entry.id);
    });

    it("should allow duplicate emails", async () => {
      const email = `test-duplicate-${testCounter}@example.com`;

      const entry1 = await addToWaitingList(supabase, {
        email,
        comment: "First request",
      });
      testWaitingListIds.push(entry1.id);

      const entry2 = await addToWaitingList(supabase, {
        email,
        comment: "Second request",
      });
      testWaitingListIds.push(entry2.id);

      expect(entry1.id).not.toBe(entry2.id);
      expect(entry1.email).toBe(entry2.email);
      expect(entry1.comment).toBe("First request");
      expect(entry2.comment).toBe("Second request");
    });
  });

  describe("Protected Operations", () => {
    it("should allow anyone to view waiting list", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-view-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);
      const entries = await getWaitingListEntries(supabase);
      expect(entries.some((e) => e.id === entry.id)).toBe(true);
    });

    it("should allow anyone to get entry by ID", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-get-by-id-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);
      const retrievedEntry = await getWaitingListEntryById(supabase, entry.id);
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry!.id).toBe(entry.id);
    });

    it("should allow authenticated users to delete entries", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-delete-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);

      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "WL-Delete" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      await deleteWaitingListEntry(user.supabase, entry.id);

      const retrievedEntry = await getWaitingListEntryById(supabase, entry.id);
      expect(retrievedEntry).toBeNull();
    });
  });

  describe("RLS Policy Tests", () => {
    it("should deny delete access to unauthenticated users", async () => {
      await expect(deleteWaitingListEntry(supabase, 99999)).rejects.toThrow();
    });

    it("should allow any authenticated user to delete entries", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-cross-user-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);

      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "WL-RLS-Delete" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      await deleteWaitingListEntry(user.supabase, entry.id);
      const retrieved = await getWaitingListEntryById(supabase, entry.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("Data Validation", () => {
    it("should check if email exists in waiting list", async () => {
      const email = `test-email-check-${testCounter}@example.com`;
      const existsBefore = await checkEmailInWaitingList(supabase, email);
      expect(existsBefore).toBe(false);

      const entry = await addToWaitingList(supabase, { email });
      testWaitingListIds.push(entry.id);

      const existsAfter = await checkEmailInWaitingList(supabase, email);
      expect(existsAfter).toBe(true);
    });

    it("should handle email check with multiple entries for same email", async () => {
      const email = `test-multiple-${testCounter}@example.com`;

      // Add multiple entries with same email
      const entry1 = await addToWaitingList(supabase, {
        email,
        comment: "First entry",
      });
      testWaitingListIds.push(entry1.id);

      const entry2 = await addToWaitingList(supabase, {
        email,
        comment: "Second entry",
      });
      testWaitingListIds.push(entry2.id);

      // Should still return true for existing email
      const exists = await checkEmailInWaitingList(supabase, email);
      expect(exists).toBe(true);
    });
  });
});
