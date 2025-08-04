import { createClient, Session } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { logger } from "@/lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  logger.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Image upload functionality
async function uploadImageToStorage(
  imagePath: string,
  bucketName: string,
  storagePath: string
): Promise<string | null> {
  try {
    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);

    // Determine content type based on file extension
    const extension = imagePath.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/png";

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      logger.error(
        `Failed to upload image ${imagePath} to ${storagePath}:`,
        error
      );
      return null;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    logger.info(
      `Successfully uploaded image: ${imagePath} -> ${publicUrlData.publicUrl}`
    );
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error(`Error uploading image ${imagePath}:`, error);
    return null;
  }
}

// Upload image for a specific entity (no caching to ensure unique copies)
async function uploadImageForEntity(
  localImagePath: string,
  bucketName: string,
  storagePrefix: string,
  entityId: string | number
): Promise<string> {
  // Extract filename from local path
  const filename = localImagePath.split("/").pop() || "image.jpg";
  const storagePath = `${storagePrefix}/${entityId}/${filename}`;

  // Construct the full path to the test image
  const testImagePath = join(
    __dirname,
    "test-data",
    "images",
    localImagePath.replace(/^\//, "")
  );

  // Upload the image
  const uploadedUrl = await uploadImageToStorage(
    testImagePath,
    bucketName,
    storagePath
  );

  if (uploadedUrl) {
    return uploadedUrl;
  } else {
    // Fallback to original path if upload fails
    logger.warn(`Failed to upload ${localImagePath}, using original path`);
    return localImagePath;
  }
}

// Function to read markdown files using convention-based paths
async function readMarkdownFile(
  projectSlug: string,
  trainingSlug: string,
  moduleSlug?: string,
  characterSlug?: string,
  fileName?: string
): Promise<string> {
  let filePath: string;
  
  if (moduleSlug && characterSlug && fileName) {
    // Character prompt file
    filePath = join(
      __dirname,
      "test-data",
      "projects",
      projectSlug,
      "trainings",
      trainingSlug,
      "modules",
      moduleSlug,
      "characters",
      characterSlug,
      fileName
    );
  } else if (moduleSlug && fileName) {
    // Module file (instructions, prompts)
    filePath = join(
      __dirname,
      "test-data",
      "projects",
      projectSlug,
      "trainings",
      trainingSlug,
      "modules",
      moduleSlug,
      fileName
    );
  } else if (fileName) {
    // Training file (description)
    filePath = join(
      __dirname,
      "test-data",
      "projects",
      projectSlug,
      "trainings",
      trainingSlug,
      fileName
    );
  } else {
    throw new Error("Invalid parameters for readMarkdownFile");
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content.trim();
  } catch (error) {
    logger.warn(`Failed to read markdown file ${filePath}:`, error);
    return ""; // Return empty string as fallback
  }
}

const assessment_text = `
## Introduction  
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Inititation
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Tone & Empathy
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Clarity & Specificity
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Empathy & Support
Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Resolution & Next Steps
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Conclusion
Dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`;

const transcript_text = `
Jason: Hello, how are you?
John: I'm good, thank you. How are you?
Jason: Not bad, just busy. I have a lot of work to do.
John: Great to hear. I'm also busy, but I'm enjoying it.
`;

const transcript_json = [
  {
    participantName: "Jason",
    text: "Hello, how are you?",
    role: "user",
    timestamp: "2024-01-01T00:00:00Z",
    createdAtMs: 1714531200000,
    status: "IN_PROGRESS",
    isHidden: false,
  },
  {
    participantName: "John",
    text: "I'm good, thank you. How are you?",
    role: "agent",
    timestamp: "2024-01-01T00:00:00Z",
    createdAtMs: 1714531200000,
    status: "IN_PROGRESS",
    isHidden: false,
  },
  {
    participantName: "Jason",
    text: "Not bad, just busy. I have a lot of work to do.",
    role: "user",
    timestamp: "2024-01-01T00:00:00Z",
    createdAtMs: 1714531200000,
    status: "IN_PROGRESS",
    isHidden: false,
  },
  {
    participantName: "John",
    text: "Great to hear. I'm also busy, but I'm enjoying it.",
    role: "agent",
    timestamp: "2024-01-01T00:00:00Z",
    createdAtMs: 1714531200000,
    status: "IN_PROGRESS",
    isHidden: false,
  },
];

async function generateRandomHistoryEntries(
  userId: string,
  session: Session,
  projectId: number
) {
  // First, get modules that belong to trainings in this project
  const { data: projectModules, error: moduleError } = await supabase.auth
    .setSession(session)
    .then(() =>
      supabase
        .from("modules")
        .select(
          `
        id,
        training_id,
        trainings!inner(
          project_id
        )
      `
        )
        .eq("trainings.project_id", projectId)
    );

  if (moduleError) {
    logger.error("Error fetching project modules:", moduleError);
    return [];
  }

  if (!projectModules || projectModules.length === 0) {
    logger.info(`No modules found for project ${projectId}`);
    return [];
  }

  const moduleIds = projectModules.map((m) => m.id);
  logger.info(`Found ${moduleIds.length} modules for project ${projectId}`);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const entries = [];
  let totalEntries = 0;
  const maxEntries = 25;

  // Create array of dates from three months ago to now
  const dates = [];
  const currentDate = new Date();
  for (
    let d = new Date(threeMonthsAgo);
    d <= currentDate;
    d.setDate(d.getDate() + 1)
  ) {
    dates.push(new Date(d));
  }

  // Iterate through dates chronologically
  for (const d of dates) {
    // Randomly decide if this day will have entries (30% chance)
    if (Math.random() < 0.3 && totalEntries < maxEntries) {
      // Generate 1-3 entries for this day
      const numEntries = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numEntries && totalEntries < maxEntries; i++) {
        const moduleId =
          moduleIds[Math.floor(Math.random() * moduleIds.length)];

        const startedAt = new Date(d);
        // Add random hours/minutes to spread entries throughout the day
        startedAt.setHours(Math.floor(Math.random() * 14) + 8); // Between 8 AM and 10 PM
        startedAt.setMinutes(Math.floor(Math.random() * 60));

        const completedAt = new Date(startedAt);
        completedAt.setMinutes(
          completedAt.getMinutes() + Math.floor(Math.random() * 30) + 15
        ); // 15-45 minutes later

        entries.push({
          user_id: userId,
          module_id: moduleId,
          started_at: startedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          assessment_text: assessment_text,
          assessment_created: true,
          transcript_text: transcript_text,
          transcript_json: transcript_json,
        });

        totalEntries++;
      }
    }
  }

  return entries;
}

async function createAllMemberHistoryData(
  testData: TestData,
  users: TestUser[]
) {
  logger.info("Creating history data for members across all projects...");

  // For each user
  for (const user of users) {
    if (!user || !user.id) continue;

    // Sign in as the user
    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (signInError || !session) {
      logger.error(`Error signing in as ${user.email}:`, signInError);
      continue;
    }

    // Get all projects where this user is a member
    const { data: memberProjects, error: projectError } = await supabase.auth
      .setSession(session)
      .then(() =>
        supabase
          .from("projects_profiles")
          .select("project_id")
          .eq("profile_id", user.id)
      );

    if (projectError) {
      logger.error(`Error fetching projects for ${user.email}:`, projectError);
      continue;
    }

    if (!memberProjects || memberProjects.length === 0) {
      logger.info(`User ${user.email} is not a member of any projects`);
      continue;
    }

    logger.info(
      `User ${user.email} is a member of ${memberProjects.length} projects`
    );

    // For each project, create history entries
    for (const { project_id } of memberProjects) {
      // Switch to this project
      const projectSession = await switchProject(project_id, session);

      // Generate and create history entries for this project
      const historyEntries = await generateRandomHistoryEntries(
        user.id,
        projectSession,
        project_id
      );

      if (historyEntries.length === 0) {
        logger.info(
          `No history entries generated for user ${user.email} in project ${project_id}`
        );
        continue;
      }

      // Insert history entries
      const chunkSize = 10;
      for (let i = 0; i < historyEntries.length; i += chunkSize) {
        const chunk = historyEntries.slice(i, i + chunkSize);
        const { error: historyError } = await supabase.auth
          .setSession(projectSession)
          .then(() => supabase.from("history").insert(chunk));

        if (historyError) {
          logger.error(
            `Error inserting history entries for ${user.email} in project ${project_id}:`,
            historyError
          );
        }
      }

      logger.info(
        `Created ${historyEntries.length} history entries for user ${user.email} in project ${project_id}`
      );
    }
  }

  logger.info("Finished creating history data for all members");
}

type TestUser = {
  id?: string;
  email: string;
  password: string;
  role?: string;
  display_name?: string;
  avatar_url?: string;
};

type TestProjectMember = {
  email: string;
  role: string;
};

type TestModule = {
  title: string;
  slug: string;
  ordinal: number;
  ai_model: string;
  video_url?: string;
  audio_url?: string;
  characters: TestCharacterInfo[];
};

type TestCharacterInfo = {
  name: string;
  slug: string;
  avatar_url: string;
  ai_model: string;
  voice?: string;
};

type TestTraining = {
  title: string;
  slug: string;
  tagline: string;
  image_url: string;
  is_public: boolean;
  preview_url?: string;
  modules: TestModule[];
};

type TestCharacter = {
  id?: number;
  name: string;
  avatar_url: string;
  project_id: number;
  voice?: string;
  ai_model: string;
};

type TestData = {
  users: TestUser[];
  projects: TestProject[];
};

type TestProject = {
  name: string;
  slug: string;
  members: TestProjectMember[];
  trainings: TestTraining[];
};

async function createTestUsers(testData: TestData) {
  const users = testData.users.map(async (user: TestUser) => {
    try {
      // Create user first without avatar
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            display_name: user.display_name,
            avatar_url: null, // We'll update this after uploading
          },
        });

      if (authError) throw authError;

      if (!authData.user) {
        logger.error(`Failed to create user: ${user.email}`);
        return null;
      }

      // Update profile to set onboarding as complete and clear current_project_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding: "complete",
        })
        .eq("id", authData.user.id);

      if (profileError) {
        logger.error(
          `Failed to update profile for ${user.email}:`,
          profileError
        );
        throw profileError;
      }

      // Upload user avatar if provided and it's a local path
      let avatarUrl = user.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = await uploadImageForEntity(
          avatarUrl,
          "avatars",
          "user-avatars",
          authData.user.id
        );

        // Update user metadata with the new avatar URL
        if (avatarUrl && avatarUrl.startsWith("http")) {
          const { error: updateError } =
            await supabase.auth.admin.updateUserById(authData.user.id, {
              user_metadata: {
                display_name: user.display_name,
                avatar_url: avatarUrl,
              },
            });

          if (updateError) {
            logger.error(`Failed to update user avatar: ${updateError}`);
          }
        }
      }

      logger.info(`Created user: ${user.email} with avatar: ${avatarUrl}`);
      const testUser: TestUser = {
        id: authData.user.id,
        email: user.email,
        password: user.password,
        role: user.role,
      };
      return testUser;
    } catch (error) {
      logger.error(`Error creating user ${user.email}:`, error);
    }
  });

  return users;
}

async function createTestProjects(testData: TestData, users: TestUser[]) {
  let index = 0;
  for (const user of users) {
    if (user.email === "super@example.com") {
      const { error: projectError } = await supabase
        .from("projects_profiles")
        .insert({
          project_id: 1,
          profile_id: user.id,
          role: "super_admin",
        });
      if (projectError) throw projectError;
    }

    // Sign in as user to get session
    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (signInError) throw signInError;
    if (!session) throw new Error("No session created");

    let projectId: number;
    if (user.email === "super@example.com") {
      projectId = 1;
      logger.info(`Super user logged in, using project ${projectId}`);
    } else {
      const { data: newProjectId, error: projectError } = await supabase.auth
        .setSession(session)
        .then(() =>
          supabase.rpc("create_project", {
            project_name: `Project for ${user.email}`,
          })
        );

      if (projectError) throw projectError;
      if (!newProjectId) throw new Error("No project data returned");
      projectId = newProjectId;
    }

    // Use the new refreshed session for subsequent operations
    const newSession = await switchProject(projectId, session);

    // logger.debug(
    //   "JWT Contents:",
    //   JSON.stringify(decodeJWT(newSession.access_token), null, 2)
    // );

    const project = testData.projects[index];
    await setupProjectMembers(users, project.members, projectId, newSession);

    // Create characters for this project based on the training modules
    const allCharacters: TestCharacter[] = [];
    const characterMap = new Map<string, TestCharacter>();

    // Extract all unique characters from training modules
    for (const training of project.trainings) {
      for (const trainingModule of training.modules) {
        for (const character of trainingModule.characters) {
          if (!characterMap.has(character.name)) {
            const testCharacter: TestCharacter = {
              name: character.name,
              avatar_url: character.avatar_url,
              project_id: projectId,
              voice: character.voice,
              ai_model: character.ai_model,
            };
            characterMap.set(character.name, testCharacter);
            allCharacters.push(testCharacter);
          }
        }
      }
    }

    const characters = await createCharactersData(
      projectId,
      allCharacters,
      newSession,
    );
    if (!characters) throw new Error("No characters created");

    await createTrainingData(projectId, project.trainings, characters, newSession, project.slug);

    // await createHistoryData(newSession);
    logger.info(`Created project: ${projectId}`);
    index++;
  }
}

async function switchProject(
  projectId: number,
  session: Session
): Promise<Session> {
  // First, update the project creator's current_project_id
  const { error: updateError } = await supabase.auth
    .setSession(session)
    .then(() =>
      supabase
        .from("profiles")
        .update({ current_project_id: projectId })
        .eq("id", session.user.id)
    );

  if (updateError) {
    logger.error(
      `Error updating user's current project: ${updateError} with project id: ${projectId}`
    );
    throw updateError;
  }

  // Verify the update was successful
  const { data: verifyData, error: verifyError } = await supabase.auth
    .setSession(session)
    .then(() =>
      supabase
        .from("profiles")
        .select("current_project_id")
        .eq("id", session.user.id)
        .single()
    );

  logger.debug(JSON.stringify(verifyData, null, 2));
  if (verifyError || verifyData?.current_project_id !== projectId) {
    throw new Error(
      `Profile update verification failed: ${
        verifyError || "Project ID mismatch"
      }, for user ${session.user.id} and project ${projectId} does not match ${
        verifyData?.current_project_id
      }`
    );
  }
  logger.info("Project ID verified:", verifyData?.current_project_id);

  // Refresh the session to get new JWT with updated project role
  const { data: refreshData, error: refreshError } = await supabase.auth
    .setSession(session)
    .then(() => supabase.auth.refreshSession());

  if (refreshError) throw refreshError;
  if (!refreshData.session) throw new Error("No session after refresh");

  return refreshData.session;
}

async function setupProjectMembers(
  users: TestUser[],
  members: TestProjectMember[],
  projectId: number,
  session: Session
) {
  const emailToId = new Map(
    users
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .map((user) => [user.email, user.id])
  );

  // Now add members
  for (const member of members) {
    const memberId = emailToId.get(member.email);
    if (!memberId) {
      logger.warn(`Member with email ${member.email} not found`);
      continue;
    }

    const { error: projectError } = await supabase.auth
      .setSession(session)
      .then(() =>
        supabase.from("projects_profiles").insert({
          project_id: projectId,
          profile_id: memberId,
          role: member.role,
        })
      );

    if (projectError) throw projectError;
  }
}

async function createTrainingData(
  projectId: number,
  projectTrainings: TestTraining[],
  characters: TestCharacter[],
  session: Session,
  projectSlug: string
) {
  const characterNameToId = new Map(
    characters.map((character) => [character.name, character.id])
  );

  for (const training of projectTrainings) {
    try {
      // Read description from markdown file
      const description = await readMarkdownFile(
        projectSlug,
        training.slug,
        undefined,
        undefined,
        "description.md"
      );

      // Create training first without images
      const { data: trainingData, error: trainingError } = await supabase.auth
        .setSession(session)
        .then(() =>
          supabase
            .from("trainings")
            .insert({
              title: training.title,
              tagline: training.tagline,
              description: description,
              image_url: null, // We'll update this after uploading
              is_public: training.is_public,
              created_by: session.user.id,
              project_id: projectId,
              preview_url: null, // We'll update this after uploading
            })
            .select()
            .single()
        );

      if (trainingError) throw trainingError;
      if (!trainingData) throw new Error("No training data returned");

      // Now upload training images if they are local paths and update the training
      let imageUrl = training.image_url;
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = await uploadImageForEntity(
          imageUrl,
          "trainings",
          "trainings",
          trainingData.id
        );
      }

      let previewUrl = training.preview_url;
      if (previewUrl && !previewUrl.startsWith("http")) {
        previewUrl = await uploadImageForEntity(
          previewUrl,
          "trainings",
          "trainings",
          `${trainingData.id}-preview`
        );
      }

      // Update the training with the new image URLs if any were uploaded
      if (
        (imageUrl && imageUrl.startsWith("http")) ||
        (previewUrl && previewUrl.startsWith("http"))
      ) {
        const { error: updateError } = await supabase.auth
          .setSession(session)
          .then(() =>
            supabase
              .from("trainings")
              .update({
                image_url: imageUrl,
                preview_url: previewUrl,
              })
              .eq("id", trainingData.id)
          );

        if (updateError) {
          logger.error(`Failed to update training images: ${updateError}`);
        }
      }

      // Create modules for this training
      for (const moduleItem of training.modules) {
        // Read module content from markdown files
        const instructions = await readMarkdownFile(
          projectSlug,
          training.slug,
          moduleItem.slug,
          undefined,
          "instructions.md"
        );
        const scenario_prompt = await readMarkdownFile(
          projectSlug,
          training.slug,
          moduleItem.slug,
          undefined,
          "scenario_prompt.md"
        );
        const assessment_prompt = await readMarkdownFile(
          projectSlug,
          training.slug,
          moduleItem.slug,
          undefined,
          "assessment_prompt.md"
        );
        const moderator_prompt = await readMarkdownFile(
          projectSlug,
          training.slug,
          moduleItem.slug,
          undefined,
          "moderator_prompt.md"
        );

        const { data: moduleData, error: moduleError } = await supabase.auth
          .setSession(session)
          .then(() =>
            supabase
              .from("modules")
              .insert({
                training_id: trainingData.id,
                title: moduleItem.title,
                instructions: instructions,
                ordinal: moduleItem.ordinal,
                ai_model: moduleItem.ai_model,
                scenario_prompt: scenario_prompt,
                assessment_prompt: assessment_prompt,
                moderator_prompt: moderator_prompt,
                video_url: moduleItem.video_url,
                audio_url: moduleItem.audio_url,
              })
              .select()
              .single()
          );

        if (moduleError) throw moduleError;
        if (!moduleData) throw new Error("No module data returned");

        // Create modules_characters associations
        for (const moduleChar of moduleItem.characters) {
          // Read character prompt from markdown file
          const characterPrompt = await readMarkdownFile(
            projectSlug,
            training.slug,
            moduleItem.slug,
            moduleChar.slug,
            "prompt.md"
          );

          const { error: moduleCharError } = await supabase.auth
            .setSession(session)
            .then(() =>
              supabase
                .from("modules_characters")
                .insert({
                  module_id: moduleData.id,
                  character_id: characterNameToId.get(moduleChar.name),
                  ordinal: 1,
                  prompt: characterPrompt,
                })
                .select()
                .single()
            );

          if (moduleCharError) throw moduleCharError;
          logger.info(
            `Created module-character association for module ${moduleData.id} and character ${moduleChar.name}`
          );
        }
      }

      // If training is public, mark all associated characters as used in public training
      if (training.is_public) {
        const characterIds = Array.from(
          new Set(
            training.modules.flatMap(module => 
              module.characters.map(char => characterNameToId.get(char.name))
            ).filter(id => id !== undefined)
          )
        );

        if (characterIds.length > 0) {
          const { error: updateCharError } = await supabase.auth
            .setSession(session)
            .then(() =>
              supabase
                .from("characters")
                .update({ is_used_in_public_training: true })
                .in("id", characterIds)
            );

          if (updateCharError) {
            logger.error(`Failed to update character flags for public training ${training.title}:`, updateCharError);
          } else {
            logger.info(`Updated ${characterIds.length} characters as used in public training: ${training.title}`);
          }
        }
      }

      logger.info(
        `Created training: ${training.title} with ${training.modules.length} modules`
      );
    } catch (error) {
      logger.error(`Error creating training ${training.title}:`, error);
    }
  }
}

async function createCharactersData(
  projectId: number,
  projectCharacters: TestCharacter[],
  session: Session,
): Promise<TestCharacter[]> {
  const characters: TestCharacter[] = [];

  try {
    // Create characters
    for (const character of projectCharacters) {
      // First create the character without avatar
      const { data: characterData, error: characterError } = await supabase.auth
        .setSession(session)
        .then(() =>
          supabase
            .from("characters")
            .insert({
              name: character.name,
              avatar_url: null, // We'll update this after uploading
              project_id: projectId,
              created_by: session.user.id,
              voice: character.voice,
              ai_model: character.ai_model,
            })
            .select()
            .single()
        );

      if (characterError) throw characterError;
      if (!characterData) throw new Error("No character data returned");

      // Now upload avatar image if it's a local path and update the character
      let avatarUrl = character.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = await uploadImageForEntity(
          avatarUrl,
          "avatars",
          "character-avatars",
          characterData.id
        );

        // Update the character with the new avatar URL
        const { error: updateError } = await supabase.auth
          .setSession(session)
          .then(() =>
            supabase
              .from("characters")
              .update({ avatar_url: avatarUrl })
              .eq("id", characterData.id)
          );

        if (updateError) {
          logger.error(`Failed to update character avatar: ${updateError}`);
        }
      }

      // Update the character data with the final avatar URL
      characterData.avatar_url = avatarUrl;
      characters.push(characterData);
      logger.info(
        `Created character: ${character.name} with avatar: ${avatarUrl}`
      );
    }
  } catch (error) {
    logger.error("Error creating characters:", error);
  }
  return characters;
}

async function loadTestData(filePath?: string): Promise<TestData> {
  try {
    const defaultPath = join(__dirname, "test-data", "test-data.json");
    const targetPath = filePath || defaultPath;

    const fileContent = await fs.readFile(targetPath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    logger.error("Error loading test data:", error);
    process.exit(1);
  }
}

async function createTestData() {
  // Get file path from command line args if provided
  const providedPath = process.argv[2];
  const testData = await loadTestData(providedPath);

  const testUsers = await Promise.all(await createTestUsers(testData));
  const validTestUsers = testUsers.filter(
    (user) => user !== null && user !== undefined
  );

  if (!testUsers) {
    logger.error("No users created");
    return;
  }

  await createTestProjects(testData, validTestUsers);

  await createAllMemberHistoryData(testData, validTestUsers);
}

// Add help text if --help flag is provided
if (process.argv.includes("--help")) {
  logger.info(`
Usage: ts-node import-data.ts [path-to-test-data.json]

If no path is provided, the script will use the default test data file at:
${join(__dirname, "test-data", "test-data.json")}
  `);
  process.exit(0);
}

createTestData()
  .then(() => logger.info("Test data creation completed"))
  .catch((error) => logger.error("Error in test data creation:", error))
  .finally(() => process.exit());
