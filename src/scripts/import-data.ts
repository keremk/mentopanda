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

interface TestUser {
  email: string;
  password: string;
  role: "admin" | "manager" | "member";
  organization_id?: number;
}

async function createHistoryForUser(userId: string) {
  for (const history of testData.history) {
    try {
      const { error: historyError } = await supabase
        .from("history") // Updated from 'activities'
        .insert({
          user_id: userId,
          module_id: history.module_id,
          transcript: history.transcript,
          recording_url: history.recording_url,
          assessment_text: history.assessment_text,
          assessment_score: history.assessment_score,
          completed_at: history.completed ? new Date().toISOString() : null,
          started_at: new Date(
            Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
          ),
        });

      if (historyError) throw historyError;
    } catch (error) {
      console.error(`Error creating history entry for user ${userId}:`, error);
    }
  }
}

async function createTestUsers() {
  for (const user of testData.users) {
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
        continue;
      }

      // Update user role directly in profiles table
      const organizationId = user.organization_id || 1;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ user_role: user.role, organization_id: organizationId })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Create activities for users
      await createHistoryForUser(authData.user.id);

      console.log(
        `Created user: ${user.email} with role: ${user.role} and sample activities`
      );
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
}

async function createTrainingData() {
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
          scenario_prompt: module.scenario_prompt,
          assessment_prompt: module.assessment_prompt,
          character_name1: module.character_name1,
          character_prompt1: module.character_prompt1,
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


createTrainingData()
  .then(() => createTestUsers())
  .then(() => console.log("Test data creation completed"))
  .catch((error) => console.error("Error in test data creation:", error))
  .finally(() => process.exit());