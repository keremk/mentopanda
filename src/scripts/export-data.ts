import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

type ExportData = {
  users: {
    email: string;
    password: string;
    role: "admin" | "manager" | "member";
    organization_id?: number;
  }[];
  history: {
    transcript: string | null;
    recording_url: string | null;
    assessment_text: string | null;
    module_id: number;
    completed: boolean;
  }[];
  trainings: {
    title: string;
    tagline: string | null;
    description: string | null;
    image_url: string | null;
    is_public: boolean;
    organization_id: number;
    preview_url: string | null;
    modules: {
      title: string;
      instructions: string | null;
      ordinal: number;
      ai_model: string | null;
      scenario_prompt: string | null;
      assessment_prompt: string | null;
      moderator_prompt: string | null;
      video_url: string | null;
      audio_url: string | null;
    }[];
  }[];
};

async function exportData(outputFile: string) {
  try {
    // First, get all users from auth.users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Then get the corresponding profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_role, organization_id")
      .in(
        "id",
        authUsers.users.map((u) => u.id)
      );

    if (profilesError) throw profilesError;

    // Combine auth users with profiles
    const users = authUsers.users.map((authUser, index) => ({
      email: authUser.email ?? "",
      password: "Test123!",
      role: profiles[index]?.user_role ?? "member",
      ...(profiles[index]?.organization_id !== 1 && {
        organization_id: profiles[index]?.organization_id,
      }),
    }));

    // Fetch history
    const { data: history, error: historyError } = await supabase
      .from("history")
      .select("*")
      .limit(3); // The test data is repeated for the users, so we only need 3

    if (historyError) throw historyError;

    // Fetch trainings with their modules
    const { data: trainings, error: trainingsError } = await supabase.from(
      "trainings"
    ).select(`
        *,
        modules (
          title,
          instructions,
          ordinal,
          ai_model,
          scenario_prompt,
          assessment_prompt,
          moderator_prompt,
          video_url,
          audio_url
        )
      `);

    if (trainingsError) throw trainingsError;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const exportData: ExportData = {
      users,
      history: history.map((h) => ({
        transcript: h.transcript,
        recording_url: h.recording_url,
        assessment_text: h.assessment_text,
        module_id: h.module_id!,
        completed: h.completed_at !== null,
      })),
      trainings: trainings.map((t) => ({
        title: t.title,
        tagline: t.tagline,
        description: t.description,
        image_url: t.image_url,
        is_public: t.is_public,
        organization_id: t.organization_id!,
        preview_url: t.preview_url,
        modules: t.modules.sort((a: any, b: any) => a.ordinal - b.ordinal),
      })),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  
    const outputPath = path.resolve(process.cwd(), outputFile);
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(exportData, null, 2),
      "utf8"
    );

    console.log(`Data exported successfully to ${outputPath}`);
  } catch (error) {
    console.error("Error exporting data:", error);
    process.exit(1);
  }
}

// Get filename from command line arguments
const filename = process.argv[2];
if (!filename) {
  console.error("Please provide an output filename");
  process.exit(1);
}

exportData(filename).catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
