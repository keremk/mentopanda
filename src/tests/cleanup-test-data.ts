#!/usr/bin/env tsx

/**
 * Cleanup script to remove test data from the database
 * Run with: npx tsx src/tests/cleanup-test-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function cleanupTestData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
    process.exit(1);
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("🧹 Starting cleanup of test data...");

  try {
    // Get all waiting list entries with test email patterns
    const { data: waitingListEntries, error: fetchError } = await adminSupabase
      .from("waiting_list")
      .select("id, email")
      .like("email", "%test-%@example.com");

    if (fetchError) {
      console.error("Error fetching waiting list entries:", fetchError);
      return;
    }

    if (waitingListEntries && waitingListEntries.length > 0) {
      console.log(
        `📧 Found ${waitingListEntries.length} test waiting list entries to clean up:`
      );
      waitingListEntries.forEach((entry) => {
        console.log(`  - ${entry.email} (ID: ${entry.id})`);
      });

      // Delete test waiting list entries
      const { error: deleteError } = await adminSupabase
        .from("waiting_list")
        .delete()
        .like("email", "%test-%@example.com");

      if (deleteError) {
        console.error("Error deleting waiting list entries:", deleteError);
      } else {
        console.log(
          `✅ Successfully deleted ${waitingListEntries.length} test waiting list entries`
        );
      }
    } else {
      console.log("✨ No test waiting list entries found");
    }

    // Clean up test invite codes
    const { data: inviteCodes, error: codesError } = await adminSupabase
      .from("invite_codes")
      .select("id, code, created_for")
      .like("created_for", "%test%");

    if (codesError) {
      console.warn("Error fetching invite codes:", codesError);
    } else if (inviteCodes && inviteCodes.length > 0) {
      console.log(
        `🎫 Found ${inviteCodes.length} test invite codes to clean up`
      );

      const { error: deleteCodesError } = await adminSupabase
        .from("invite_codes")
        .delete()
        .like("created_for", "%test%");

      if (deleteCodesError) {
        console.error("Error deleting invite codes:", deleteCodesError);
      } else {
        console.log(
          `✅ Successfully deleted ${inviteCodes.length} test invite codes`
        );
      }
    } else {
      console.log("✨ No test invite codes found");
    }

    // Clean up test projects
    const { data: testProjects, error: projectsError } = await adminSupabase
      .from("projects")
      .select("id, name")
      .like("name", "%Test Project%");

    if (projectsError) {
      console.warn("Error fetching test projects:", projectsError);
    } else if (testProjects && testProjects.length > 0) {
      console.log(`🏗️ Found ${testProjects.length} test projects to clean up`);

      for (const project of testProjects) {
        // Delete project associations first
        await adminSupabase
          .from("projects_profiles")
          .delete()
          .eq("project_id", project.id);

        // Delete the project
        await adminSupabase.from("projects").delete().eq("id", project.id);

        console.log(`✅ Deleted test project: ${project.name}`);
      }
    } else {
      console.log("✨ No test projects found");
    }

    // Clean up test users (auth users with test emails)
    try {
      // Get test users from auth.users
      const { data: authUsers, error: authUsersError } =
        await adminSupabase.auth.admin.listUsers();

      if (authUsersError) {
        console.warn("Error fetching auth users:", authUsersError);
      } else if (authUsers && authUsers.users.length > 0) {
        const testUsers = authUsers.users.filter(
          (user) =>
            user.email &&
            user.email.includes("test-") &&
            user.email.includes("@example.com")
        );

        if (testUsers.length > 0) {
          console.log(`👤 Found ${testUsers.length} test users to clean up`);

          for (const user of testUsers) {
            try {
              // Delete project associations
              await adminSupabase
                .from("projects_profiles")
                .delete()
                .eq("profile_id", user.id);

              // Delete profile
              await adminSupabase.from("profiles").delete().eq("id", user.id);

              // Delete auth user
              await adminSupabase.auth.admin.deleteUser(user.id);

              console.log(`✅ Deleted test user: ${user.email}`);
            } catch (error) {
              console.warn(`⚠️ Error deleting user ${user.email}:`, error);
            }
          }
        } else {
          console.log("✨ No test users found");
        }
      }
    } catch (error) {
      console.warn("⚠️ Error during user cleanup:", error);
    }

    console.log("🎉 Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupTestData().then(() => {
    process.exit(0);
  });
}

export { cleanupTestData };
