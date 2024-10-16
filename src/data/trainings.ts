import { createClient } from '@/utils/supabase/server'

export interface Training {
  id: string
  title: string
  tagline: string
  description: string
  image_url: string
  is_public: boolean
  organization_id: string | null
  preview_url: string | null
  created_at: string
  updated_at: string
  // Add any other fields that are part of your trainings table
}

export async function getTrainings(): Promise<Training[]> {
  const supabase = createClient();

  // Check if the user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;

  // Get the user's organization ID
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user data: ${userError.message}`);
  }

  const organizationId = userData.organization_id;

  // Query trainings
  let query = supabase.from("trainings").select("*").or("is_public.eq.true");

  // Add organization filter only if organizationId is not null
  if (organizationId !== null) {
    query = query.or(`organization_id.eq.${organizationId}`);
  }

  const { data: userTrainings, error: trainingsError } = await query;

  if (trainingsError) {
    throw new Error(`Failed to fetch trainings: ${trainingsError.message}`);
  }

  return userTrainings as Training[];
}
