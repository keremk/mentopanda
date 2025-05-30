import { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export function handleError(error: PostgrestError) {
  // Postgres error codes: https://docs.postgrest.org/en/v12/references/errors.html
  logger.error(`Postgres error: ${error.message}`);
  if (error.code === "42501") {
    throw new Error("Access denied. Please check your permissions.");
  } else if (error.code === "PGRST301") {
    throw new Error("Row-level security policy violation.");
  } else {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

