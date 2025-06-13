import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { type SubscriptionTier } from "@/lib/usage/types";

let testCounter = 0;

// Define role types and their permissions based on DB seeds
export type TestUserRole = "admin" | "manager" | "member" | "super_admin";
const ROLE_PERMISSIONS: Record<TestUserRole, string[]> = {
  admin: [
    "training.manage",
    "enrollment.manage",
    "project.manage",
    "project.member.manage",
    "training.history",
    "basic.access",
  ],
  manager: ["training.manage", "basic.access"],
  member: ["basic.access"],
  super_admin: [
    "training.manage",
    "enrollment.manage",
    "project.manage",
    "project.member.manage",
    "training.history",
    "basic.access",
    "trials.manage",
  ],
};

// Define the shape of a user creation request
export type UserRequest = {
  role: TestUserRole;
  projectName: string;
  pricingPlan?: SubscriptionTier;
};

// Define the shape of the returned user object
export type CreatedUser = {
  id: string;
  email: string;
  supabase: SupabaseClient<Database>;
  projectId: number;
  role: TestUserRole;
  pricingPlan: SubscriptionTier;
};

/**
 * Creates a flexible test environment with multiple projects and users.
 *
 * @param adminSupabase - The master Supabase client with service role privileges.
 * @param requests - An array of UserRequest objects defining which users to create.
 * @returns An object containing arrays of created users and project IDs.
 */
export async function setupTestEnvironment(
  adminSupabase: SupabaseClient<Database>,
  requests: UserRequest[]
) {
  const createdUsers: CreatedUser[] = [];
  const projects: Map<string, number> = new Map();
  const createdProjectIds: number[] = [];
  const createdUserIds: string[] = [];

  for (const request of requests) {
    let projectId: number;

    // 1. Create Project if it doesn't exist for this run
    if (projects.has(request.projectName)) {
      projectId = projects.get(request.projectName)!;
    } else {
      testCounter++;
      const uniqueProjectName = `${
        request.projectName
      }-${testCounter}-${Date.now()}`;
      const { data: project, error: projectError } = await adminSupabase
        .from("projects")
        .insert({ name: uniqueProjectName, is_public: false })
        .select("id")
        .single();
      if (projectError)
        throw new Error(`Failed to create project: ${projectError.message}`);
      projectId = project.id;
      projects.set(request.projectName, projectId);
      createdProjectIds.push(projectId);
    }

    // 2. Create User
    testCounter++;
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const email = `test-${request.role}-${testCounter}-${randomSuffix}@example.com`;
    const password = "test-password-123";
    const { data: auth, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (authError || !auth.user)
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    const userId = auth.user.id;
    createdUserIds.push(userId);

    // 3. Link User to Project and Profile
    await adminSupabase.from("projects_profiles").insert({
      project_id: projectId,
      profile_id: userId,
      role: request.role,
    });
    await adminSupabase
      .from("profiles")
      .update({
        current_project_id: projectId,
        pricing_plan: request.pricingPlan ?? "free",
      })
      .eq("id", userId);

    // 4. Set custom claims for RLS
    const { error: updateError } =
      await adminSupabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          permissions: ROLE_PERMISSIONS[request.role],
          current_project_id: projectId,
        },
      });
    if (updateError)
      throw new Error(
        `Failed to set user app_metadata: ${updateError.message}`
      );

    // 5. Create a dedicated, signed-in client for the new user
    const userSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: signInError } = await userSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError)
      throw new Error(`Sign-in failed for ${email}: ${signInError.message}`);

    createdUsers.push({
      id: userId,
      email,
      supabase: userSupabase,
      projectId,
      role: request.role,
      pricingPlan: request.pricingPlan ?? "free",
    });
  }

  return { createdUsers, createdProjectIds, createdUserIds };
}

/**
 * Cleans up all resources created during a test run.
 *
 * @param adminSupabase - The master Supabase client.
 * @param projectIds - An array of project IDs to delete.
 * @param userIds - An array of user IDs to delete.
 */
export async function cleanupTestEnvironment(
  adminSupabase: SupabaseClient<Database>,
  projectIds: number[],
  userIds: string[]
) {
  // Delete projects, which will cascade to related tables
  if (projectIds.length > 0) {
    const { error } = await adminSupabase
      .from("projects")
      .delete()
      .in("id", projectIds);
    if (error) {
      console.error("Failed to clean up projects:", error.message);
    }
  }

  // Delete auth users
  for (const userId of userIds) {
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error(`Failed to delete auth user ${userId}:`, error.message);
    }
  }
}
