import { createClient, User } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join, dirname } from "path";
import fs from "fs/promises";
import * as readline from "node:readline/promises"; // Import readline for interactive prompt
import { stdin as input, stdout as output } from "node:process"; // Import streams for readline
import { logger } from "@/lib/logger";

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.error(
    "Error: Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Initialize Supabase client with Service Role Key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Define specific types based on the database schema
type Profile = {
  id: string; // uuid
  current_project_id: number | null;
  pricing_plan: string; // Assuming enum maps to string
  created_at: string;
  updated_at: string;
};

type Project = {
  id: number;
  name: string | null;
  is_public: boolean;
  created_by: string | null; // uuid
  created_at: string;
  updated_at: string;
};

type ProjectMember = {
  profile_id: string; // uuid
  role: string; // user_role enum
  profiles: {
    id: string;
    email: string | null;
  } | null;
};

type ProjectMembership = {
  project_id: number;
  profile_id: string; // uuid
  role: string; // user_role enum
  created_at: string;
  updated_at: string;
  projects: {
    name: string | null;
  } | null;
};

type ModuleCharacterLink = {
  character_id: number;
  ordinal: number;
  prompt: string | null;
  // Maybe include character name for context?
  // characters: { name: string } | null;
};

type Module = {
  id: number;
  training_id: number;
  title: string;
  instructions: string | null;
  ordinal: number;
  ai_model: string | null;
  scenario_prompt: string | null;
  assessment_prompt: string | null;
  moderator_prompt: string | null;
  video_url: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
  // Add nested characters links
  module_character_links?: ModuleCharacterLink[];
};

type Training = {
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  preview_url: string | null;
  created_by: string | null; // uuid
  project_id: number;
  created_at: string;
  updated_at: string;
  // Add nested modules
  modules?: Module[];
};

type Character = {
  id: number;
  name: string;
  voice: string | null;
  ai_description: string | null;
  ai_model: string | null;
  description: string | null;
  avatar_url: string | null;
  project_id: number;
  created_by: string | null; // uuid
  created_at: string;
  updated_at: string;
};

type Enrollment = {
  id: number;
  training_id: number;
  user_id: string; // uuid
  created_at: string;
  updated_at: string;
  trainings: {
    title: string | null;
  } | null;
};

type HistoryEntry = {
  id: number;
  module_id: number | null;
  user_id: string; // uuid
  transcript_text: string | null;
  transcript_json: unknown | null; // Use unknown for JSON blobs for type safety
  recording_url: string | null;
  assessment_created: boolean;
  assessment_text: string | null;
  practice_no: number;
  started_at: string | null;
  completed_at: string | null;
  modules: {
    title: string | null;
  } | null;
};

type Invitation = {
  id: number;
  project_id: number | null;
  inviter_id: string; // uuid
  invitee_email: string;
  inviter_display_name: string;
  inviter_email: string;
  role: string; // user_role enum
  created_at: string;
  updated_at: string;
};

type UserData = {
  user: User | null;
  profile: Profile | null;
  projectsCreated: Project[];
  membersLosingAccess: { projectId: number; members: ProjectMember[] }[];
  projectMemberships: ProjectMembership[];
  trainingsCreated: Training[];
  charactersCreated: Character[];
  enrollments: Enrollment[];
  history: HistoryEntry[];
  invitations: Invitation[];
};

/**
 * Finds a user by email or UUID.
 * @param identifier User's email or UUID.
 * @returns The Supabase User object.
 * @throws Error if user not found.
 */
async function findUser(identifier: string): Promise<User> {
  let user: User | null = null;
  const isUUID =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      identifier
    );

  if (isUUID) {
    logger.info(`Searching for user by UUID: ${identifier}...`);
    const { data, error } = await supabase.auth.admin.getUserById(identifier);
    if (error) throw new Error(`Error fetching user by ID: ${error.message}`);
    if (!data?.user) throw new Error(`User with UUID ${identifier} not found.`);
    user = data.user;
  } else {
    logger.info(`Searching for user by email: ${identifier}...`);
    // Listing users might be necessary if direct lookup fails or isn't available for email in admin context easily.
    // Note: This can be slow for large user bases.
    const { data, error } = await supabase.auth.admin.listUsers({
      // Supabase admin API doesn't have a direct 'filter by email' yet, listUsers might be needed.
      // If your user base is large, consider a direct DB query if allowed.
      // For now, we fetch all and filter, which is inefficient.
      // A more direct approach: query the auth.users table if service key allows SQL.
      page: 1,
      perPage: 10000, // Adjust perPage as needed, but be mindful of limits
    });
    if (error) throw new Error(`Error listing users: ${error.message}`);
    user = data.users.find((u) => u.email === identifier) || null;
    if (!user) throw new Error(`User with email ${identifier} not found.`);
  }

  logger.info(`User found: ${user.email} (ID: ${user.id})`);
  return user;
}

/**
 * Fetches all data associated with a user ID.
 * @param userId The UUID of the user.
 * @param userEmail The email of the user.
 * @returns An object containing all user-related data.
 */
async function fetchAllUserData(
  userId: string,
  userEmail: string
): Promise<UserData> {
  logger.info(`Fetching all data for user ID: ${userId}...`);
  const userData: UserData = {
    user: null,
    profile: null,
    projectsCreated: [],
    membersLosingAccess: [],
    projectMemberships: [],
    trainingsCreated: [],
    charactersCreated: [],
    enrollments: [],
    history: [],
    invitations: [],
  };

  // --- Fetch Core User Data ---
  const { data: userRes, error: userErr } =
    await supabase.auth.admin.getUserById(userId);
  if (userErr)
    logger.error(
      `Warning: Could not re-fetch user details: ${userErr.message}`
    );
  userData.user = userRes?.user ?? null;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (profileError && profileError.code !== "PGRST116") {
    // Ignore 'not found' error, could happen if cascade deleted early
    logger.error(`Warning: Error fetching profile: ${profileError.message}`);
  }
  userData.profile = profileData;

  // --- Fetch Created Items ---
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", userId);
  if (projectsError)  
    logger.error(
      `Warning: Error fetching created projects: ${projectsError.message}`
    );
  userData.projectsCreated = projectsData || [];

  // Find members who will lose access (Two-step process)
  const memberProfileIds = new Set<string>();
  const projectMembershipsMap: Map<
    number,
    Array<{ profile_id: string; role: string }>
  > = new Map();

  for (const project of userData.projectsCreated) {
    // Step 1: Fetch profile_id and role from projects_profiles
    const { data: memberships, error: membersError } = await supabase
      .from("projects_profiles")
      .select(`profile_id, role`)
      .eq("project_id", project.id)
      .neq("profile_id", userId); // Exclude the owner

    if (membersError) {
      logger.error(
        `Warning: Error fetching memberships for project ${project.id}: ${membersError.message}`
      );
      projectMembershipsMap.set(project.id, []);
      continue;
    }

    const currentMembers = memberships || [];
    projectMembershipsMap.set(project.id, currentMembers);
    currentMembers.forEach((m) => memberProfileIds.add(m.profile_id));
  }

  // Step 2: Fetch user details (email) for the collected profile IDs using RPC
  let memberDetailsMap: Map<string, { id: string; email: string | null }> =
    new Map();
  if (memberProfileIds.size > 0) {
    // Use RPC call to the new database function
    const { data: usersData, error: usersError } = await supabase.rpc(
      "get_user_emails_by_ids",
      {
        // Calling the new SQL function
        user_ids: Array.from(memberProfileIds),
      }
    );
    // Note: RPC return type might be slightly different, adjust mapping if needed.
    // Supabase often returns RPC data within a 'data' property itself,
    // but let's assume direct array return for now based on function definition.

    if (usersError) {
      logger.error(
        `Warning: Error fetching member user details via RPC: ${usersError.message}`
      );
    } else {
      // Ensure usersData is an array before mapping
      if (Array.isArray(usersData)) {
        memberDetailsMap = new Map(
          usersData.map((u) => [u.id, { id: u.id, email: u.email }])
        );
      } else {
        logger.error(
          `Warning: Unexpected data format received from RPC get_user_emails_by_ids:`,
          usersData
        );
      }
    }
  }

  // Step 3: Combine the data
  userData.membersLosingAccess = userData.projectsCreated.map((project) => {
    const members = projectMembershipsMap.get(project.id) || [];
    const typedMembers: ProjectMember[] = members.map((m) => {
      const userDetails = memberDetailsMap.get(m.profile_id);
      return {
        profile_id: m.profile_id,
        role: m.role,
        profiles: userDetails
          ? { id: userDetails.id, email: userDetails.email }
          : null,
      };
    });
    return { projectId: project.id, members: typedMembers };
  });

  // Fetch Trainings
  const { data: trainingsData, error: trainingsError } = await supabase
    .from("trainings")
    .select("*")
    .eq("created_by", userId);
  if (trainingsError)
    logger.error(  
      `Warning: Error fetching created trainings: ${trainingsError.message}`
    );
  userData.trainingsCreated = trainingsData || [];

  // Fetch Modules and ModuleCharacterLinks for each created training
  for (const training of userData.trainingsCreated) {
    logger.info(`Fetching modules for training ID: ${training.id}...`);
    const { data: modulesData, error: modulesError } = await supabase
      .from("modules")
      .select("*")
      .eq("training_id", training.id);

    if (modulesError) {
      logger.error(
        `Warning: Error fetching modules for training ${training.id}: ${modulesError.message}`
      );
      training.modules = []; // Ensure modules property exists even if fetch fails
      continue; // Skip to next training
    }

    const modules: Module[] = modulesData || [];

    // Fetch character links for each module
    for (const moduleItem of modules) {
      logger.info(
        `Fetching character links for module ID: ${moduleItem.id}...`
      );
      const { data: linksData, error: linksError } = await supabase
        .from("modules_characters")
        // Select needed fields, maybe join character name if needed
        .select("character_id, ordinal, prompt")
        .eq("module_id", moduleItem.id);

      if (linksError) {
        logger.error(
          `Warning: Error fetching module_characters for module ${moduleItem.id}: ${linksError.message}`
        );
        moduleItem.module_character_links = []; // Ensure property exists
      } else {
        moduleItem.module_character_links = linksData || [];
      }
    }

    // Assign the fetched modules (with their links) back to the training object
    training.modules = modules;
  }

  const { data: charactersData, error: charactersError } = await supabase
    .from("characters")
    .select("*")
    .eq("created_by", userId);
  if (charactersError)
    logger.error(
      `Warning: Error fetching created characters: ${charactersError.message}`
    );
  userData.charactersCreated = charactersData || [];

  // --- Fetch Associations ---
  const { data: membershipsData, error: membershipsError } = await supabase
    .from("projects_profiles")
    .select("*, projects(name)") // Select project name for clarity
    .eq("profile_id", userId)
    .not(
      "project_id",
      "in",
      `(${userData.projectsCreated.map((p) => p.id).join(",") || "null"})`
    ); // Exclude memberships in own projects
  if (membershipsError)
    logger.error(
      `Warning: Error fetching project memberships: ${membershipsError.message}`
    );
  userData.projectMemberships = membershipsData || [];

  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("*, trainings(title)")
    .eq("user_id", userId);
  if (enrollmentsError)
    logger.error(
      `Warning: Error fetching enrollments: ${enrollmentsError.message}`
    );
  userData.enrollments = enrollmentsData || [];

  const { data: historyData, error: historyError } = await supabase
    .from("history")
    .select("*, modules(title)")
    .eq("user_id", userId);
  if (historyError)
    logger.error(`Warning: Error fetching history: ${historyError.message}`);
  userData.history = historyData || [];

  // Fetch invitations (sent by user OR sent to user)
  const { data: invitationsData, error: invitationsError } = await supabase
    .from("invitations")
    .select("*")
    .or(`inviter_id.eq.${userId},invitee_email.eq.${userEmail}`);
  if (invitationsError)
    logger.error(
      `Warning: Error fetching invitations: ${invitationsError.message}`
    );
  userData.invitations = invitationsData || [];

  logger.info("Finished fetching user data.");
  return userData;
}

/**
 * Saves the user data to a JSON file.
 * @param userData The user data object.
 * @param userId The user's UUID.
 * @param outputDir The directory to save the file in.
 */
async function saveUserData(
  userData: UserData,
  userId: string,
  outputDir: string
): Promise<string> {
  try {
    const filePath = join(outputDir, `user-data-${userId}-${Date.now()}.json`);
    logger.info(`Saving user data to ${filePath}...`);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    logger.info(`User data successfully saved to ${filePath}`);
    return filePath;
  } catch (error: unknown) {
    // Use unknown instead of any
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    logger.error(`Error saving user data: ${message}`);
    throw error; // Re-throw to stop execution if saving fails
  }
}

/**
 * Displays a summary of the data that will be deleted.
 * @param userData The fetched user data.
 * @param filePath Path to the saved JSON file.
 */
function displayDeletionPlan(userData: UserData, filePath: string): void {
  logger.info("\n--- GDPR User Deletion Plan ---");
  logger.info(
    `Data for user ${userData.user?.email} (ID: ${userData.user?.id}) has been exported to:`
  );
  logger.info(filePath);
  logger.info("\nThe following data WILL BE DELETED upon confirmation:");
  logger.info(`\n[Core Data]`);
  logger.info(
    `- User Account: ${userData.user?.email} (ID: ${userData.user?.id})`
  );
  logger.info(
    `- Profile Record: ${userData.profile ? `ID ${userData.profile.id}` : "Not found/Already deleted"}`
  );

  logger.info(`\n[Items Created by User]`);
  if (userData.projectsCreated.length > 0) {
    logger.info(
      `- Projects Created (${userData.projectsCreated.length}): IDs ${userData.projectsCreated.map((p) => p.id).join(", ")}`
    );
    // List specific members losing access
    userData.membersLosingAccess.forEach((projMembers) => {
      if (projMembers.members.length > 0) {
        logger.info(
          `  - Members losing access to Project ${projMembers.projectId}: ${projMembers.members.map((m) => m.profiles?.email || m.profile_id).join(", ")}`
        );
      } 
    });
  } else {
    logger.info("- Projects Created: 0");
  }
  logger.info(`- Trainings Created: ${userData.trainingsCreated.length}`);
  if (userData.trainingsCreated.length > 0) {
    logger.info(
      `  (Associated modules and character links will also be deleted via cascade)`
    );
    // Add clarification about other users' history
    logger.info(
      `  (History records of OTHER users for these modules will have module_id set to NULL, but the records will remain)`
    );
  }
  logger.info(`- Characters Created: ${userData.charactersCreated.length}`);

  logger.info(`\n[User's Associations]`);
  logger.info(
    `- Project Memberships (in others' projects): ${userData.projectMemberships.length}`
  );
  logger.info(`- Enrollments: ${userData.enrollments.length}`);
  logger.info(
    `- History/Assessment Records (Owned by User): ${userData.history.length}`
  );
  logger.info(
    `- Invitations (Sent or Received): ${userData.invitations.length}`
  );

  logger.info("\n--- WARNING ---");
  logger.info("This action is IRREVERSIBLE.");
  logger.info("Review the exported JSON file carefully.");
  logger.info(
    "To proceed with deletion, re-run the script with the --confirm-delete flag."
  );
  logger.info(
    "Example: `ts-node src/scripts/delete-user.ts <identifier> [--output-dir=<path>] [--confirm-delete]"
  );
  logger.info("---------------------------------\n");
}

/**
 * Deletes all data associated with the user.
 * @param userId The UUID of the user to delete.
 * @param userEmail The email of the user.
 * @param createdProjectIds Array of project IDs created by the user.
 */
async function deleteUserData(
  userId: string,
  userEmail: string,
  createdProjectIds: number[]
): Promise<void> {
  logger.info(`\n--- Starting Deletion Process for User ID: ${userId} ---`);

  // 1. Delete Invitations (sent by or to the user)
  logger.info("Deleting invitations...");
  const { error: invError } = await supabase
    .from("invitations")
    .delete()
    .or(`inviter_id.eq.${userId},invitee_email.eq.${userEmail}`);
  if (invError) {
    logger.error(
      `Error deleting invitations: ${invError.message}. Continuing...`
    );
  } else {
    logger.info("Invitations deleted successfully.");
  }

  // 2. Delete Projects Created by User (Cascades should handle related items WITHIN these projects)
  // Includes: projects_profiles, trainings, modules, characters, enrollments, history (if module linked)
  if (createdProjectIds.length > 0) {
    logger.info(
      `Deleting projects created by user: IDs ${createdProjectIds.join(", ")}...`
    );
    const { error: projDelError } = await supabase
      .from("projects")
      .delete()
      .in("id", createdProjectIds);
    if (projDelError) {
      logger.error(
        `Error deleting created projects: ${projDelError.message}. Foreign key constraints might prevent full deletion. Check DB logs. Continuing...`
      );
      // Manual cleanup might be needed if cascade fails or isn't fully configured.
    } else {
      logger.info(
        "Created projects (and their contents via cascade) deleted successfully."
      );
    }
  } else {
    logger.info("No projects created by user to delete.");
  }

  // 3. Delete Remaining Project Memberships (in projects NOT created by the user)
  logger.info("Deleting remaining project memberships...");
  const { error: membershipError } = await supabase
    .from("projects_profiles")
    .delete()
    .eq("profile_id", userId);
  if (membershipError && membershipError.code !== "23503") {
    // Ignore FK violation if project was deleted already
    logger.error(
      `Error deleting project memberships: ${membershipError.message}. Continuing...`
    );
  } else {
    logger.info("Remaining project memberships deleted successfully.");
  }

  // 4. Delete User Account (This should cascade to 'profiles' table and then further)
  // Cascade from profiles: enrollments, history
  logger.info(
    `Deleting user account (auth.users) and triggering cascades for profile ID: ${userId}...`
  );
  const { error: deletionError } = await supabase.auth.admin.deleteUser(userId);

  if (deletionError) {
    // Log the error but maybe the user was already deleted or partially deleted.
    logger.error(
      `!!! Critical Error deleting user account: ${deletionError.message} !!!`
    );
    logger.error(
      "Manual cleanup in 'auth.users' and potentially related tables might be required."
    );
    // Depending on the error, you might want to stop or continue trying cleanup.
    // For now, we log and finish.
  } else {
    logger.info("User account deleted successfully from auth.users.");
    logger.info(
      "Cascading deletes for profiles, enrollments, history should have been triggered."
    );
  }

  // Note: Enrollments and History linked to the profile via user_id should be deleted by the CASCADE
  // constraint on `profiles.id` FOREIGN KEY. If not, manual deletion would be needed here:
  // await supabase.from("enrollments").delete().eq("user_id", userId);
  // await supabase.from("history").delete().eq("user_id", userId);

  logger.info("--- Deletion Process Completed ---");
  logger.info("Please verify data removal in the database.");
}

// Main execution function
async function main() {
  // Manual argument parsing
  const args = process.argv.slice(2); // Skip node path and script path

  let identifier: string | undefined;
  let outputDir = "./gdpr-exports"; // Default output directory

  for (const arg of args) {
    if (arg.startsWith("--output-dir=")) {
      outputDir = arg.split("=")[1];
    } else if (!arg.startsWith("--")) {
      // Assume the first non-flag argument is the identifier
      if (!identifier) {
        identifier = arg;
      } else {
        logger.warn(`Ignoring extra argument: ${arg}`);
      }
    } else {
      logger.warn(`Ignoring unknown flag: ${arg}`);
    }
  }

  // Validate required identifier
  if (!identifier) {
    logger.error("Error: User identifier (email or UUID) is required.");
    logger.info(
      "Usage: ts-node src/scripts/delete-user.ts <identifier> [--output-dir=<path>]"
    );
    process.exit(1);
  }

  logger.info("--- Script Configuration ---");
  logger.info(`Identifier: ${identifier}`);
  logger.info(`Output Directory: ${outputDir}`);
  logger.info("---------------------------");

  let rl: readline.Interface | undefined;
  try {
    // 1. Find the user
    const user = await findUser(identifier);
    const userId = user.id;
    const userEmail = user.email;

    if (!userId || !userEmail) {
      throw new Error("User ID or Email could not be determined.");
    }

    // 2. Fetch all user data
    const userData = await fetchAllUserData(userId, userEmail);

    // 3. Save user data to file
    const filePath = await saveUserData(userData, userId, outputDir);

    // 4. Display plan
    displayDeletionPlan(userData, filePath);

    // 5. Ask for interactive confirmation
    rl = readline.createInterface({ input, output });
    const answer = await rl.question(
      `\nARE YOU SURE you want to delete all data for user ${userEmail}? \nThis action is IRREVERSIBLE. (y/N): `
    );
    rl.close(); // Close the interface

    // 6. Perform deletion only if confirmed
    if (answer.toLowerCase().trim() === "y") {
      logger.info("Confirmation received. Proceeding with deletion...");
      // Add a small delay just in case
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay

      const createdProjectIds = userData.projectsCreated.map((p) => p.id);
      await deleteUserData(userId, userEmail, createdProjectIds);
      logger.info("User data deletion process finished.");
    } else {
      logger.info("Deletion aborted by user.");
    }
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) message = error.message;
    logger.error(`\nScript failed: ${message}`);
    process.exit(1);
  } finally {
    // Ensure readline interface is closed even if errors occur after creation
    if (rl) {
      rl.close();
    }
  }
}

main();
