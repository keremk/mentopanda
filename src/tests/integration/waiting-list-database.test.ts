import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  addToWaitingList,
  getWaitingListEntries,
  getWaitingListEntryById,
  deleteWaitingListEntry,
  checkEmailInWaitingList,
  type CreateWaitingListParams,
} from "@/data/waiting-list";

describe("Waiting List Database Integration Tests", () => {
  let supabase: SupabaseClient;
  let adminSupabase: SupabaseClient;
  let testWaitingListIds: number[] = [];
  let testUserIds: string[] = [];
  let testCounter = 0;

  beforeAll(async () => {
    // Create Supabase client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
      );
    }

    // Admin client for user management
    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Regular client for testing
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(() => {
    testWaitingListIds = [];
    testUserIds = [];
    testCounter++;
  });

  afterEach(async () => {
    await cleanupTestData();
    await supabase.auth.signOut();
  });

  async function cleanupTestData() {
    try {
      // Delete waiting list entries using admin client
      if (testWaitingListIds.length > 0) {
        await adminSupabase
          .from("waiting_list")
          .delete()
          .in("id", testWaitingListIds);
      }

      // Also cleanup any orphaned test entries by email pattern
      await adminSupabase
        .from("waiting_list")
        .delete()
        .like("email", "%test-%@example.com");

      // Delete test users and their profiles
      if (testUserIds.length > 0) {
        // Delete project profile associations
        await adminSupabase
          .from("projects_profiles")
          .delete()
          .in("profile_id", testUserIds);

        // Delete profiles first
        await adminSupabase.from("profiles").delete().in("id", testUserIds);

        // Delete auth users
        for (const userId of testUserIds) {
          await adminSupabase.auth.admin.deleteUser(userId);
        }
      }

      // Clean up test project
      await adminSupabase
        .from("projects")
        .delete()
        .eq("name", "Test Project Waiting List");
    } catch (error) {
      console.warn("Cleanup error (may be expected):", error);
    }
  }

  async function createTestUser(
    emailPrefix: string,
    hasTrialsManagePermission: boolean = true
  ): Promise<{
    userId: string;
    email: string;
    password: string;
    projectId: number;
  }> {
    const email = `${emailPrefix}-${testCounter}@example.com`;
    const password = "test-password-123";

    // Create auth user using admin client
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;
    testUserIds.push(userId);

    // Create a test project for this user if it doesn't exist
    const { data: projectData, error: projectError } = await adminSupabase
      .from("projects")
      .select("id")
      .eq("name", "Test Project Waiting List")
      .single();

    let projectId: number;
    if (projectError && projectError.code === "PGRST116") {
      // Project doesn't exist, create it
      const { data: newProject, error: createError } = await adminSupabase
        .from("projects")
        .insert({
          name: "Test Project Waiting List",
          is_public: false,
        })
        .select("id")
        .single();

      if (createError || !newProject) {
        throw new Error(
          `Failed to create test project: ${createError?.message}`
        );
      }
      projectId = newProject.id;
    } else if (projectError) {
      throw new Error(`Failed to query test project: ${projectError.message}`);
    } else {
      projectId = projectData.id;
    }

    // Assign user to project with appropriate role
    const userRole = hasTrialsManagePermission ? "super_admin" : "member";

    const { error: roleError } = await adminSupabase
      .from("projects_profiles")
      .insert({
        project_id: projectId,
        profile_id: userId,
        role: userRole,
      });

    if (roleError) {
      throw new Error(`Failed to assign user role: ${roleError.message}`);
    }

    // Update the profile with current_project_id
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        current_project_id: projectId,
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return { userId, email, password, projectId };
  }

  async function signInUser(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to sign in user: ${error.message}`);
    }

    // Wait a bit for the session to be established
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // async function signOutUser(): Promise<void> {
  //   await supabase.auth.signOut();
  // }

  describe("Public Access (No Authentication Required)", () => {
    it("should allow anyone to add to waiting list", async () => {
      const params: CreateWaitingListParams = {
        email: `test-public-${testCounter}@example.com`,
        comment: "I'm excited to try this product!",
      };

      const entry = await addToWaitingList(supabase, params);

      expect(entry).toBeDefined();
      expect(entry.id).toBeTypeOf("number");
      expect(entry.email).toBe(params.email);
      expect(entry.comment).toBe(params.comment);
      expect(entry.date_requested).toBeDefined();

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

  describe("Protected Operations (authentication required)", () => {
    it("should allow anyone to view waiting list", async () => {
      // Add some entries to the waiting list
      const entry1 = await addToWaitingList(supabase, {
        email: `test-view-1-${testCounter}@example.com`,
        comment: "First entry",
      });
      testWaitingListIds.push(entry1.id);

      const entry2 = await addToWaitingList(supabase, {
        email: `test-view-2-${testCounter}@example.com`,
        comment: "Second entry",
      });
      testWaitingListIds.push(entry2.id);

      // No authentication required for viewing
      const entries = await getWaitingListEntries(supabase);

      expect(entries.length).toBeGreaterThanOrEqual(2);
      expect(entries.some((e) => e.id === entry1.id)).toBe(true);
      expect(entries.some((e) => e.id === entry2.id)).toBe(true);

      // Should be ordered by date_requested desc (newest first)
      for (let i = 1; i < entries.length; i++) {
        const prev = new Date(entries[i - 1].date_requested);
        const curr = new Date(entries[i].date_requested);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it("should allow anyone to get entry by ID", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-get-by-id-${testCounter}@example.com`,
        comment: "Test comment",
      });
      testWaitingListIds.push(entry.id);

      // No authentication required for viewing
      const retrievedEntry = await getWaitingListEntryById(supabase, entry.id);

      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry!.id).toBe(entry.id);
      expect(retrievedEntry!.email).toBe(entry.email);
      expect(retrievedEntry!.comment).toBe(entry.comment);
    });

    it("should allow authenticated users to delete entries", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-delete-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);

      const user = await createTestUser("test-deleter", false);
      await signInUser(user.email, user.password);

      await deleteWaitingListEntry(supabase, entry.id);

      const retrievedEntry = await getWaitingListEntryById(supabase, entry.id);
      expect(retrievedEntry).toBeNull();

      // Remove from cleanup list since it's already deleted
      testWaitingListIds = testWaitingListIds.filter((id) => id !== entry.id);
    });
  });

  describe("RLS Policy Tests", () => {
    it("should deny delete access to unauthenticated users", async () => {
      // Should fail to delete entry without authentication
      await expect(async () => {
        await deleteWaitingListEntry(supabase, 1);
      }).rejects.toThrow();
    });

    it("should allow any authenticated user to delete entries", async () => {
      // Create entry without authentication
      const entry = await addToWaitingList(supabase, {
        email: `test-cross-user-${testCounter}@example.com`,
      });
      testWaitingListIds.push(entry.id);

      // Create authenticated user (no special permissions needed)
      const user = await createTestUser("test-cross-1", false);

      // Anyone can view the entry (no auth required)
      const entries = await getWaitingListEntries(supabase);
      expect(entries.some((e) => e.id === entry.id)).toBe(true);

      // Only authenticated users can delete
      await signInUser(user.email, user.password);
      await deleteWaitingListEntry(supabase, entry.id);
      testWaitingListIds = testWaitingListIds.filter((id) => id !== entry.id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long emails", async () => {
      const longEmail = "a".repeat(200) + "@example.com";
      const entry = await addToWaitingList(supabase, {
        email: longEmail,
      });

      expect(entry.email).toBe(longEmail);
      testWaitingListIds.push(entry.id);
    });

    it("should handle very long comments", async () => {
      const longComment = "This is a very long comment. ".repeat(100);
      const entry = await addToWaitingList(supabase, {
        email: `test-long-comment-${testCounter}@example.com`,
        comment: longComment,
      });

      expect(entry.comment).toBe(longComment);
      testWaitingListIds.push(entry.id);
    });

    it("should handle empty string comment", async () => {
      const entry = await addToWaitingList(supabase, {
        email: `test-empty-comment-${testCounter}@example.com`,
        comment: "",
      });

      expect(entry.comment).toBe("");
      testWaitingListIds.push(entry.id);
    });

    it("should return null for non-existent entry", async () => {
      const user = await createTestUser("test-not-found", true);
      await signInUser(user.email, user.password);

      const entry = await getWaitingListEntryById(supabase, 999999);
      expect(entry).toBeNull();
    });

    it("should handle deleting non-existent entry gracefully", async () => {
      const user = await createTestUser("test-delete-not-found", true);
      await signInUser(user.email, user.password);

      // Should not throw an error
      await deleteWaitingListEntry(supabase, 999999);
    });
  });

  describe("Data Validation", () => {
    it("should preserve date_requested timestamp", async () => {
      const beforeTime = new Date();

      const entry = await addToWaitingList(supabase, {
        email: `test-timestamp-${testCounter}@example.com`,
      });

      const afterTime = new Date();
      const entryTime = new Date(entry.date_requested);

      expect(entryTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(entryTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());

      testWaitingListIds.push(entry.id);
    });

    it("should maintain data integrity across operations", async () => {
      const originalData = {
        email: `test-integrity-${testCounter}@example.com`,
        comment: "Original comment",
      };

      const entry = await addToWaitingList(supabase, originalData);
      testWaitingListIds.push(entry.id);

      const user = await createTestUser("test-integrity", false);
      await signInUser(user.email, user.password);

      const retrieved = await getWaitingListEntryById(supabase, entry.id);

      expect(retrieved!.email).toBe(originalData.email);
      expect(retrieved!.comment).toBe(originalData.comment);
      expect(retrieved!.date_requested).toBe(entry.date_requested);
    });

    it("should check if email exists in waiting list", async () => {
      const email = `test-email-check-${testCounter}@example.com`;

      // Email should not exist initially
      const existsBefore = await checkEmailInWaitingList(supabase, email);
      expect(existsBefore).toBe(false);

      // Add email to waiting list
      const entry = await addToWaitingList(supabase, { email });
      testWaitingListIds.push(entry.id);

      // Email should now exist
      const existsAfter = await checkEmailInWaitingList(supabase, email);
      expect(existsAfter).toBe(true);

      // Check different email should return false
      const existsDifferent = await checkEmailInWaitingList(
        supabase,
        `different-${email}`
      );
      expect(existsDifferent).toBe(false);
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
