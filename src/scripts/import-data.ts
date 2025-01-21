import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import testData from "./test-data.json";

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
        });

        totalEntries++;
      }
    }
  }

  return entries;
}

async function createHistoryData(userId: string) {
  // First, get all available module IDs
  const { data: modules, error: moduleError } = await supabase
    .from("modules")
    .select("id");

  if (moduleError) {
    console.error("Error fetching modules:", moduleError);
    return;
  }

  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length === 0) {
    console.error("No modules found to create history entries");
    return;
  }

  const historyEntries = generateRandomHistoryEntries(userId, moduleIds);

  // Insert history entries in chunks to avoid rate limits
  const chunkSize = 10;
  for (let i = 0; i < historyEntries.length; i += chunkSize) {
    const chunk = historyEntries.slice(i, i + chunkSize);
    const { error: historyError } = await supabase
      .from("history")
      .insert(chunk);

    if (historyError) {
      console.error(
        `Error inserting history entries chunk ${i}:`,
        historyError
      );
    }
  }

  console.log(
    `Created ${historyEntries.length} history entries for user ${userId}`
  );
}

async function createTestUsers() {
  const users = testData.users.map(async (user) => {
    try {
      // Create user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

      if (authError) throw authError;

      if (!authData.user) {
        console.error(`Failed to create user: ${user.email}`);
        return null;
      }

      // Update user role directly in profiles table
      const organizationId = user.organization_id || 1;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ user_role: user.role, organization_id: organizationId })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      console.log(
        `Created user: ${user.email} with role: ${user.role} and sample activities`
      );
      return {
        id: authData.user.id,
        email: user.email,
        role: user.role,
        organization_id: organizationId,
      };
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  });

  return users;
}

async function createTrainingData(userId: string) {
  for (const training of testData.trainings) {
    try {
      // Create training
      const { data: trainingData, error: trainingError } = await supabase
        .from("trainings")
        .insert({
          title: training.title,
          tagline: training.tagline,
          description: training.description,
          image_url: training.image_url,
          is_public: training.is_public,
          created_by: userId,
          organization_id: training.organization_id,
          preview_url: training.preview_url,
        })
        .select()
        .single();

      if (trainingError) throw trainingError;
      if (!trainingData) throw new Error("No training data returned");

      // Create modules for this training
      for (const module of training.modules) {
        const { error: moduleError } = await supabase.from("modules").insert({
          training_id: trainingData.id,
          title: module.title,
          instructions: module.instructions,
          ordinal: module.ordinal,
          ai_model: module.ai_model,
          scenario_prompt: module.scenario_prompt,
          assessment_prompt: module.assessment_prompt,
          moderator_prompt: module.moderator_prompt,
          video_url: module.video_url,
          audio_url: module.audio_url,
        });

        if (moduleError) throw moduleError;
      }

      console.log(
        `Created training: ${training.title} with ${training.modules.length} modules`
      );
    } catch (error) {
      console.error(`Error creating training ${training.title}:`, error);
    }
  }
}

async function createCharactersData(userId: string) {
  try {
    // Create characters
    for (const character of testData.characters) {
      const { data: characterData, error: characterError } = await supabase
        .from("characters")
        .insert({
          name: character.name,
          ai_description: character.ai_description,
          description: character.description,
          avatar_url: character.avatar_url,
          organization_id: character.organization_id,
          is_public: character.is_public,
          created_by: userId,
          voice: character.voice,
          ai_model: character.ai_model,
        })
        .select()
        .single();

      if (characterError) throw characterError;
      if (!characterData) throw new Error("No character data returned");

      console.log(`Created character: ${character.name}`);
    }

    // Create modules_characters associations
    for (const moduleChar of testData.modules_characters) {
      const { error: moduleCharError } = await supabase
        .from("modules_characters")
        .insert({
          module_id: moduleChar.module_id,
          character_id: moduleChar.character_id,
          ordinal: moduleChar.ordinal,
          prompt: moduleChar.prompt,
        });

      if (moduleCharError) throw moduleCharError;
      console.log(
        `Created module-character association for module ${moduleChar.module_id}`
      );
    }
  } catch (error) {
    console.error("Error creating characters:", error);
  }
}

async function createTestData() {
  const testUsers = await Promise.all(await createTestUsers());
  const mainUser = testUsers?.find(
    (user) => user?.email === "admin@codingventures.com"
  );

  if (!mainUser) {
    console.error("Main user not found");
    return;
  }

  // Pass userId to createCharactersData
  await createTrainingData(mainUser.id);
  await createCharactersData(mainUser.id);
  await createHistoryData(mainUser.id);
}

createTestData()
  .then(() => console.log("Test data creation completed"))
  .catch((error) => console.error("Error in test data creation:", error))
  .finally(() => process.exit());
