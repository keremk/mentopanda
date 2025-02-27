import { createClient, Session } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join } from "path";
import fs from "fs/promises";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

function generateRandomHistoryEntries(userId: string, moduleIds: number[]) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const entries = [];
  let totalEntries = 0;
  const maxEntries = 50;

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

async function createHistoryData(session: Session) {
  // First, get all available module IDs
  const { data: modules, error: moduleError } = await supabase.auth
    .setSession(session)
    .then(() => supabase.from("modules").select("id"));

  if (moduleError) {
    console.error("Error fetching modules:", moduleError);
    return;
  }

  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length === 0) {
    console.error("No modules found to create history entries");
    return;
  }

  const historyEntries = generateRandomHistoryEntries(
    session.user.id,
    moduleIds
  );

  // Insert history entries in chunks to avoid rate limits
  const chunkSize = 10;
  for (let i = 0; i < historyEntries.length; i += chunkSize) {
    const chunk = historyEntries.slice(i, i + chunkSize);
    const { error: historyError } = await supabase.auth
      .setSession(session)
      .then(() => supabase.from("history").insert(chunk));

    if (historyError) {
      console.error(
        `Error inserting history entries chunk ${i}:`,
        historyError
      );
    }
  }

  console.log(
    `Created ${historyEntries.length} history entries for user ${session.user.id}`
  );
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
  instructions: string;
  ordinal: number;
  ai_model: string;
  scenario_prompt: string;
  assessment_prompt: string;
  moderator_prompt: string;
  video_url?: string;
  audio_url?: string;
  characters: TestCharacterInfo[];
};

type TestCharacterInfo = {
  character_name: string;
  prompt: string;
};

type TestTraining = {
  title: string;
  tagline: string;
  description: string;
  image_url: string;
  is_public: boolean;
  organization_id: number;
  preview_url?: string;
  modules: TestModule[];
};

type TestCharacter = {
  id?: number;
  name: string;
  ai_description: string;
  description: string;
  avatar_url: string;
  organization_id: number;
  is_public: boolean;
  voice?: string;
  ai_model: string;
};

type ModuleCharacter = {
  module_id: number;
  character_id: number;
  ordinal: number;
  prompt: string;
};

type TestData = {
  users: TestUser[];
  projects: TestProject[];
  trainings: TestTraining[];
  characters: TestCharacter[];
  modules_characters: ModuleCharacter[];
  members: TestProjectMember[][];
};

type TestProject = {
  name: string;
  members: TestProjectMember[];
  trainings: string[] ;
  characters: string[];
};

async function createTestUsers(testData: TestData) {
  const users = testData.users.map(async (user: TestUser) => {
    try {
      // Create user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            display_name: user.display_name,
            avatar_url: user.avatar_url,
          },
        });

      if (authError) throw authError;

      if (!authData.user) {
        console.error(`Failed to create user: ${user.email}`);
        return null;
      }

      console.log(`Created user: ${user.email}`);
      const testUser: TestUser = {
        id: authData.user.id,
        email: user.email,
        password: user.password,
        role: user.role,
      };
      return testUser;
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  });

  return users;
}

async function createTestProjects(
  testData: TestData,
  users: TestUser[],
) {
  let index = 0;
  for (const user of users) {
    if (user.email === "super@example.com") {
      const { error: projectError } = await supabase
        .from("projects_profiles")
        .insert({
          project_id: 1,
          profile_id: user.id,
          role: "admin",
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
      console.log(`Super user logged in, using project ${projectId}`);
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

    // console.log(
    //   "JWT Contents:",
    //   JSON.stringify(decodeJWT(newSession.access_token), null, 2)
    // );

    const project = testData.projects[index];
    await setupProjectMembers(users, project.members, projectId, newSession);

    const inputCharacters = project.characters.map(
      (characterName) => {
        const character = testData.characters.find(
          (c) => c.name === characterName
        );
        return character;
      }
    ).filter((c): c is TestCharacter => c !== undefined);

    const characters = await createCharactersData(
      projectId,
      inputCharacters,
      newSession
    );
    if (!characters) throw new Error("No characters created");
    
    const inputTrainings = project.trainings.map(
      (trainingName) => {
        const training = testData.trainings.find(
          (t) => t.title === trainingName
        );
        return training;
      }
    ).filter((t): t is TestTraining => t !== undefined);
    await createTrainingData(projectId, inputTrainings, characters, newSession);

    await createHistoryData(newSession);
    console.log(`Created project: ${projectId}`);
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
    console.error(
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

  console.log(JSON.stringify(verifyData, null, 2));
  if (verifyError || verifyData?.current_project_id !== projectId) {
    throw new Error(
      `Profile update verification failed: ${
        verifyError || "Project ID mismatch"
      }, for user ${session.user.id} and project ${projectId} does not match ${
        verifyData?.current_project_id
      }`
    );
  }
  console.log("Project ID verified:", verifyData?.current_project_id);

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
      console.warn(`Member with email ${member.email} not found`);
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
  session: Session
) {
  const characterNameToId = new Map(
    characters.map((character) => [character.name, character.id])
  );

  for (const training of projectTrainings) {
    try {
      // Create training
      const { data: trainingData, error: trainingError } = await supabase.auth
        .setSession(session)
        .then(() =>
          supabase
            .from("trainings")
            .insert({
              title: training.title,
              tagline: training.tagline,
              description: training.description,
              image_url: training.image_url,
              created_by: session.user.id,
              project_id: projectId,
              preview_url: training.preview_url,
            })
            .select()
            .single()
        );

      if (trainingError) throw trainingError;
      if (!trainingData) throw new Error("No training data returned");

      // Create modules for this training
      for (const moduleItem of training.modules) {
        const { data: moduleData, error: moduleError } = await supabase.auth
          .setSession(session)
          .then(() =>
            supabase
              .from("modules")
              .insert({
                training_id: trainingData.id,
                title: moduleItem.title,
                instructions: moduleItem.instructions,
                ordinal: moduleItem.ordinal,
                ai_model: moduleItem.ai_model,
                scenario_prompt: moduleItem.scenario_prompt,
                assessment_prompt: moduleItem.assessment_prompt,
                moderator_prompt: moduleItem.moderator_prompt,
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
          const { error: moduleCharError } = await supabase.auth
            .setSession(session)
            .then(() =>
              supabase
                .from("modules_characters")
                .insert({
                  module_id: moduleData.id,
                  character_id: characterNameToId.get(
                    moduleChar.character_name
                  ),
                  ordinal: 1,
                  prompt: moduleChar.prompt,
                })
                .select()
                .single()
            );

          if (moduleCharError) throw moduleCharError;
          console.log(
            `Created module-character association for module ${moduleData.id} and character ${moduleChar.character_name}`
          );
        }
      }

      console.log(
        `Created training: ${training.title} with ${training.modules.length} modules`
      );
    } catch (error) {
      console.error(`Error creating training ${training.title}:`, error);
    }
  }
}

async function createCharactersData(
  projectId: number,
  projectCharacters: TestCharacter[],
  session: Session
): Promise<TestCharacter[]> {
  const characters: TestCharacter[] = [];

  try {
    // Create characters
    for (const character of projectCharacters) {
      const { data: characterData, error: characterError } = await supabase.auth
        .setSession(session)
        .then(() =>
          supabase
            .from("characters")
            .insert({
              name: character.name,
              ai_description: character.ai_description,
              description: character.description,
              avatar_url: character.avatar_url,
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

      characters.push(characterData);
      console.log(`Created character: ${character.name}`);
    }
  } catch (error) {
    console.error("Error creating characters:", error);
  }
  return characters;
}

async function loadTestData(filePath?: string): Promise<TestData> {
  try {
    const defaultPath = join(__dirname, "test-data.json");
    const targetPath = filePath || defaultPath;

    const fileContent = await fs.readFile(targetPath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error loading test data:", error);
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
    console.error("No users created");
    return;
  }

  await createTestProjects(testData, validTestUsers);
}

// Add help text if --help flag is provided
if (process.argv.includes("--help")) {
  console.log(`
Usage: ts-node import-data.ts [path-to-test-data.json]

If no path is provided, the script will use the default test data file at:
${join(__dirname, "test-data.json")}
  `);
  process.exit(0);
}

createTestData()
  .then(() => console.log("Test data creation completed"))
  .catch((error) => console.error("Error in test data creation:", error))
  .finally(() => process.exit());
