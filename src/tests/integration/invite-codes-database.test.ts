import { describe, it, expect, beforeAll, afterEach } from "vitest";
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
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

describe("Invite Codes Database Integration Tests", () => {
  let adminSupabase: SupabaseClient;
  let testInviteCodeIds: number[] = [];
  let projectIds: number[] = [];
  let userIds: string[] = [];

  beforeAll(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
      );
    }

    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterEach(async () => {
    // Manually clean up invite codes as they don't cascade delete with projects
    if (testInviteCodeIds.length > 0) {
      await adminSupabase
        .from("invite_codes")
        .delete()
        .in("id", testInviteCodeIds);
    }
    // Use the generic environment cleanup
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);

    // Reset arrays for the next test
    testInviteCodeIds = [];
    projectIds = [];
    userIds = [];
  });

  describe("CRUD Operations", () => {
    it("should create an invite code with auto-generated code", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "Invite-CRUD" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const params: CreateInviteCodeParams = {
        expire_by: 7,
        created_for: "test@example.com",
      };

      const inviteCode = await createInviteCode(user.supabase, params);

      expect(inviteCode).toBeDefined();
      expect(inviteCode.id).toBeTypeOf("number");
      expect(inviteCode.code).toBeTypeOf("string");
      expect(inviteCode.code.length).toBeGreaterThan(8);
      expect(inviteCode.created_by).toBe(user.id);
      expect(inviteCode.expire_by).toBe(7);
      expect(inviteCode.created_for).toBe("test@example.com");
      expect(inviteCode.validated).toBe(false);

      testInviteCodeIds.push(inviteCode.id);
    });

    it("should create an invite code with custom code", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "Invite-CRUD-Custom" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const customCode = generateInviteCode(12);
      const params: CreateInviteCodeParams = {
        code: customCode,
        expire_by: 5,
        created_for: null,
      };

      const inviteCode = await createInviteCode(user.supabase, params);

      expect(inviteCode.code).toBe(customCode);
      expect(inviteCode.created_by).toBe(user.id);

      testInviteCodeIds.push(inviteCode.id);
    });

    it("should get invite codes by user", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "Invite-Get" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      for (let i = 0; i < 3; i++) {
        const inviteCode = await createInviteCode(user.supabase, {
          expire_by: 5,
          created_for: `test${i}@example.com`,
        });
        testInviteCodeIds.push(inviteCode.id);
      }

      const retrievedCodes = await getInviteCodesByUser(user.supabase);

      expect(retrievedCodes).toHaveLength(3);
      expect(retrievedCodes.every((code) => code.created_by === user.id)).toBe(
        true
      );
    });

    it("should get invite code by ID", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "Invite-Get-ID" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const createdCode = await createInviteCode(user.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(createdCode.id);

      const retrievedCode = await getInviteCodeById(
        user.supabase,
        createdCode.id
      );

      expect(retrievedCode).toBeDefined();
      expect(retrievedCode!.id).toBe(createdCode.id);
      expect(retrievedCode!.created_by).toBe(user.id);
    });

    it("should delete an invite code", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "Invite-Delete" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const createdCode = await createInviteCode(user.supabase, {
        expire_by: 5,
      });

      await deleteInviteCode(user.supabase, createdCode.id);

      const retrievedCode = await getInviteCodeById(
        user.supabase,
        createdCode.id
      );
      expect(retrievedCode).toBeNull();
    });
  });

  describe("RLS Policy Tests", () => {
    it("should only allow users to see their own invite codes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "RLS-Project" },
          { role: "super_admin", projectName: "RLS-Project" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      const user1Code = await createInviteCode(user1.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(user1Code.id);

      const user2Code = await createInviteCode(user2.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(user2Code.id);

      const user1Codes = await getInviteCodesByUser(user1.supabase);
      expect(user1Codes).toHaveLength(1);
      expect(user1Codes[0].id).toBe(user1Code.id);

      const user2Codes = await getInviteCodesByUser(user2.supabase);
      expect(user2Codes).toHaveLength(1);
      expect(user2Codes[0].id).toBe(user2Code.id);
    });

    it("should not allow users to access other users' codes by ID", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "RLS-Access" },
          { role: "super_admin", projectName: "RLS-Access" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      const user1Code = await createInviteCode(user1.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(user1Code.id);

      const retrievedCode = await getInviteCodeById(
        user2.supabase,
        user1Code.id
      );
      expect(retrievedCode).toBeNull();
    });

    it("should not allow users to delete other users' codes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "RLS-Delete" },
          { role: "super_admin", projectName: "RLS-Delete" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user1 = createdUsers[0]!;
      const user2 = createdUsers[1]!;

      const user1Code = await createInviteCode(user1.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(user1Code.id);

      await deleteInviteCode(user2.supabase, user1Code.id);

      const retrievedCode = await getInviteCodeById(
        user1.supabase,
        user1Code.id
      );
      expect(retrievedCode).toBeDefined();
    });

    it("should require trials.manage permission to create invite codes", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          // This user is a 'member' and does not have 'trials.manage'
          { role: "member", projectName: "RLS-Perms" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      await expect(
        createInviteCode(user.supabase, { expire_by: 5 })
      ).rejects.toThrow();
    });
  });

  describe("SQL Functions (SECURITY DEFINER)", () => {
    it("should validate a valid invite code", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "SQL-Func" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const createdCode = await createInviteCode(user.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(createdCode.id);

      const result = await validateInviteCode(anonSupabase, createdCode.code);

      expect(result.isValid).toBe(true);
      expect(result.inviteCode).toBeDefined();
      expect(result.inviteCode!.validated).toBe(true);
    });

    it("should get invite code by code", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "super_admin", projectName: "SQL-Func-Get" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const createdCode = await createInviteCode(user.supabase, {
        expire_by: 5,
      });
      testInviteCodeIds.push(createdCode.id);

      const retrievedCode = await getInviteCodeByCode(
        anonSupabase,
        createdCode.code
      );

      expect(retrievedCode).toBeDefined();
      expect(retrievedCode!.code).toBe(createdCode.code);
    });
  });
});
