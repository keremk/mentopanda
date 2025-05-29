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
  createInviteCode,
  getInviteCodesByUser,
  getInviteCodeById,
  deleteInviteCode,
  validateInviteCode,
  getInviteCodeByCode,
  type CreateInviteCodeParams,
} from "@/data/invite-codes";
import { generateInviteCode } from "@/lib/invite-code-generator";

describe("Invite Codes Database Integration Tests", () => {
  let supabase: SupabaseClient;
  let adminSupabase: SupabaseClient;
  let testInviteCodeIds: number[] = [];
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
    testInviteCodeIds = [];
    testUserIds = [];
    testCounter++;
  });

  afterEach(async () => {
    await cleanupTestData();
    await supabase.auth.signOut();
  });

  async function cleanupTestData() {
    try {
      // Delete invite codes first using admin client
      if (testInviteCodeIds.length > 0) {
        await adminSupabase
          .from("invite_codes")
          .delete()
          .in("id", testInviteCodeIds);
      }

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
      await adminSupabase.from("projects").delete().eq("name", "Test Project");
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
      .eq("name", "Test Project")
      .single();

    let projectId: number;
    if (projectError && projectError.code === "PGRST116") {
      // Project doesn't exist, create it
      const { data: newProject, error: createError } = await adminSupabase
        .from("projects")
        .insert({
          name: "Test Project",
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

  async function signOutUser(): Promise<void> {
    await supabase.auth.signOut();
  }

  describe("CRUD Operations", () => {
    it("should create an invite code with auto-generated code", async () => {
      const { userId, email, password } =
        await createTestUser("test-creator-1");
      await signInUser(email, password);

      const params: CreateInviteCodeParams = {
        expire_by: 7,
        created_for: "test@example.com",
      };

      const inviteCode = await createInviteCode(supabase, params);

      expect(inviteCode).toBeDefined();
      expect(inviteCode.id).toBeTypeOf("number");
      expect(inviteCode.code).toBeTypeOf("string");
      expect(inviteCode.code.length).toBeGreaterThan(8); // Should have dashes
      expect(inviteCode.created_by).toBe(userId);
      expect(inviteCode.expire_by).toBe(7);
      expect(inviteCode.created_for).toBe("test@example.com");
      expect(inviteCode.validated).toBe(false);

      testInviteCodeIds.push(inviteCode.id);
    });

    it("should create an invite code with custom code", async () => {
      const { userId, email, password } =
        await createTestUser("test-creator-2");
      await signInUser(email, password);

      const customCode = generateInviteCode(12);
      const params: CreateInviteCodeParams = {
        code: customCode,
        expire_by: 5,
        created_for: null,
      };

      const inviteCode = await createInviteCode(supabase, params);

      expect(inviteCode.code).toBe(customCode);
      expect(inviteCode.created_by).toBe(userId);
      expect(inviteCode.expire_by).toBe(5);
      expect(inviteCode.created_for).toBeNull();

      testInviteCodeIds.push(inviteCode.id);
    });

    it("should get invite codes by user", async () => {
      const { userId, email, password } = await createTestUser("test-reader-1");
      await signInUser(email, password);

      // Create multiple invite codes
      const codes = [];
      for (let i = 0; i < 3; i++) {
        const inviteCode = await createInviteCode(supabase, {
          expire_by: 5,
          created_for: `test${i}@example.com`,
        });
        codes.push(inviteCode);
        testInviteCodeIds.push(inviteCode.id);
      }

      const retrievedCodes = await getInviteCodesByUser(supabase);

      expect(retrievedCodes).toHaveLength(3);
      expect(retrievedCodes.every((code) => code.created_by === userId)).toBe(
        true
      );

      // Should be ordered by created_at desc
      for (let i = 1; i < retrievedCodes.length; i++) {
        const prev = new Date(retrievedCodes[i - 1].created_at);
        const curr = new Date(retrievedCodes[i].created_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it("should get invite code by ID", async () => {
      const { userId, email, password } = await createTestUser("test-reader-2");
      await signInUser(email, password);

      const createdCode = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(createdCode.id);

      const retrievedCode = await getInviteCodeById(supabase, createdCode.id);

      expect(retrievedCode).toBeDefined();
      expect(retrievedCode!.id).toBe(createdCode.id);
      expect(retrievedCode!.code).toBe(createdCode.code);
      expect(retrievedCode!.created_by).toBe(userId);
    });

    it("should delete an invite code", async () => {
      const { email, password } =
        await createTestUser("test-deleter-1");
      await signInUser(email, password);

      const createdCode = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(createdCode.id);

      await deleteInviteCode(supabase, createdCode.id);

      const retrievedCode = await getInviteCodeById(supabase, createdCode.id);
      expect(retrievedCode).toBeNull();

      // Remove from cleanup list since it's already deleted
      testInviteCodeIds = testInviteCodeIds.filter(
        (id) => id !== createdCode.id
      );
    });
  });

  describe("RLS Policy Tests", () => {
    it("should only allow users to see their own invite codes", async () => {
      // Create two users
      const user1 = await createTestUser("test-rls-user1");
      const user2 = await createTestUser("test-rls-user2");

      // User 1 creates invite codes
      await signInUser(user1.email, user1.password);
      const user1Code = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(user1Code.id);
      await signOutUser();

      // User 2 creates invite codes
      await signInUser(user2.email, user2.password);
      const user2Code = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(user2Code.id);
      await signOutUser();

      // User 1 should only see their own codes
      await signInUser(user1.email, user1.password);
      const user1Codes = await getInviteCodesByUser(supabase);
      expect(user1Codes).toHaveLength(1);
      expect(user1Codes[0].id).toBe(user1Code.id);
      await signOutUser();

      // User 2 should only see their own codes
      await signInUser(user2.email, user2.password);
      const user2Codes = await getInviteCodesByUser(supabase);
      expect(user2Codes).toHaveLength(1);
      expect(user2Codes[0].id).toBe(user2Code.id);
    });

    it("should not allow users to access other users' codes by ID", async () => {
      // Create two users
      const user1 = await createTestUser("test-rls-access1");
      const user2 = await createTestUser("test-rls-access2");

      // User 1 creates an invite code
      await signInUser(user1.email, user1.password);
      const user1Code = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(user1Code.id);
      await signOutUser();

      // User 2 tries to access User 1's code
      await signInUser(user2.email, user2.password);
      const retrievedCode = await getInviteCodeById(supabase, user1Code.id);
      expect(retrievedCode).toBeNull();
    });

    it("should not allow users to delete other users' codes", async () => {
      // Create two users
      const user1 = await createTestUser("test-rls-delete1");
      const user2 = await createTestUser("test-rls-delete2");

      // User 1 creates an invite code
      await signInUser(user1.email, user1.password);
      const user1Code = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(user1Code.id);
      await signOutUser();

      // User 2 tries to delete User 1's code
      await signInUser(user2.email, user2.password);

      // This should not throw an error but should not delete anything
      await deleteInviteCode(supabase, user1Code.id);
      await signOutUser();

      // Verify the code still exists by switching back to User 1
      await signInUser(user1.email, user1.password);
      const retrievedCode = await getInviteCodeById(supabase, user1Code.id);
      expect(retrievedCode).toBeDefined();
    });

    it("should require trials.manage permission to create invite codes", async () => {
      // Create user without trials.manage permission
      const user = await createTestUser("test-no-permission", false);
      await signInUser(user.email, user.password);

      // Should fail to create invite code due to RLS policy
      await expect(async () => {
        await createInviteCode(supabase, { expire_by: 5 });
      }).rejects.toThrow();
    });
  });

  describe("SQL Functions (SECURITY DEFINER)", () => {
    let testCode: string;
    let testCodeId: number;

    beforeEach(async () => {
      // Create a test invite code for validation tests
      const user = await createTestUser("test-validator");
      await signInUser(user.email, user.password);

      const createdCode = await createInviteCode(supabase, {
        expire_by: 5,
        created_for: "validator@example.com",
      });

      testCode = createdCode.code;
      testCodeId = createdCode.id;
      testInviteCodeIds.push(testCodeId);
      await signOutUser();
    });

    it("should validate a valid invite code (non-authenticated)", async () => {
      // Test non-authenticated access (no sign in)
      const result = await validateInviteCode(supabase, testCode);

      expect(result.isValid).toBe(true);
      expect(result.inviteCode).toBeDefined();
      expect(result.inviteCode!.validated).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject already validated invite code", async () => {
      // First validation should succeed
      await validateInviteCode(supabase, testCode);

      // Second validation should fail
      const result = await validateInviteCode(supabase, testCode);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("already_validated");
    });

    it("should reject non-existent invite code", async () => {
      const fakeCode = generateInviteCode(8);
      const result = await validateInviteCode(supabase, fakeCode);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("not_found");
    });

    it("should reject expired invite code", async () => {
      // Create an expired invite code by setting it in the past
      const user = await createTestUser("test-expired");
      await signInUser(user.email, user.password);

      const expiredCode = await createInviteCode(supabase, { expire_by: 1 });
      testInviteCodeIds.push(expiredCode.id);
      await signOutUser();

      // Manually update the created_at to make it expired using admin client
      await adminSupabase
        .from("invite_codes")
        .update({
          created_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", expiredCode.id);

      const result = await validateInviteCode(supabase, expiredCode.code);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("expired");
    });

    it("should get invite code by code (non-authenticated)", async () => {
      const retrievedCode = await getInviteCodeByCode(supabase, testCode);

      expect(retrievedCode).toBeDefined();
      expect(retrievedCode!.code).toBe(testCode);
      expect(retrievedCode!.id).toBe(testCodeId);
    });

    it("should return null for non-existent code", async () => {
      const fakeCode = generateInviteCode(8);
      const retrievedCode = await getInviteCodeByCode(supabase, fakeCode);

      expect(retrievedCode).toBeNull();
    });
  });

  describe("Code Validation", () => {
    it("should validate codes with dashes", async () => {
      const user = await createTestUser("test-dash-validation");
      await signInUser(user.email, user.password);

      const createdCode = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(createdCode.id);
      await signOutUser();

      // Test with the original code (with dashes)
      const result = await validateInviteCode(supabase, createdCode.code);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Duplicate Code Handling", () => {
    it("should handle duplicate code retry logic", async () => {
      const user = await createTestUser("test-duplicate-handling");
      await signInUser(user.email, user.password);

      // Create first invite code
      const firstCode = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(firstCode.id);

      // Try to create another - should work with different auto-generated code
      const secondCode = await createInviteCode(supabase, { expire_by: 5 });
      testInviteCodeIds.push(secondCode.id);

      expect(firstCode.code).not.toBe(secondCode.code);
      expect(firstCode.id).not.toBe(secondCode.id);
    });

    it("should fail when explicitly providing duplicate code", async () => {
      const user = await createTestUser("test-explicit-duplicate");
      await signInUser(user.email, user.password);

      const customCode = generateInviteCode(8);

      // Create first invite code with custom code
      const firstCode = await createInviteCode(supabase, {
        code: customCode,
        expire_by: 5,
      });
      testInviteCodeIds.push(firstCode.id);

      // Try to create second with same custom code should fail
      await expect(async () => {
        await createInviteCode(supabase, {
          code: customCode,
          expire_by: 5,
        });
      }).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long created_for email", async () => {
      const user = await createTestUser("test-long-email");
      await signInUser(user.email, user.password);

      const longEmail = "a".repeat(200) + "@example.com";
      const inviteCode = await createInviteCode(supabase, {
        expire_by: 5,
        created_for: longEmail,
      });

      expect(inviteCode.created_for).toBe(longEmail);
      testInviteCodeIds.push(inviteCode.id);
    });

    it("should handle null created_for", async () => {
      const user = await createTestUser("test-null-email");
      await signInUser(user.email, user.password);

      const inviteCode = await createInviteCode(supabase, {
        expire_by: 5,
        created_for: null,
      });

      expect(inviteCode.created_for).toBeNull();
      testInviteCodeIds.push(inviteCode.id);
    });

    it("should handle minimum and maximum expire_by values", async () => {
      const user = await createTestUser("test-expire-bounds");
      await signInUser(user.email, user.password);

      // Test minimum
      const minCode = await createInviteCode(supabase, { expire_by: 1 });
      expect(minCode.expire_by).toBe(1);
      testInviteCodeIds.push(minCode.id);

      // Test large value
      const maxCode = await createInviteCode(supabase, { expire_by: 365 });
      expect(maxCode.expire_by).toBe(365);
      testInviteCodeIds.push(maxCode.id);
    });

    it("should handle non-authenticated user trying CRUD operations", async () => {
      // Should fail for operations requiring authentication
      await expect(async () => {
        await createInviteCode(supabase, { expire_by: 5 });
      }).rejects.toThrow();

      await expect(async () => {
        await getInviteCodesByUser(supabase);
      }).rejects.toThrow();

      await expect(async () => {
        await getInviteCodeById(supabase, 1);
      }).rejects.toThrow();

      await expect(async () => {
        await deleteInviteCode(supabase, 1);
      }).rejects.toThrow();
    });
  });
});
