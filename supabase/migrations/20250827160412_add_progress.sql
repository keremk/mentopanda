-- Progress tracking tables

-- progress_overall table - tracks overall progress per profile
CREATE TABLE IF NOT EXISTS "progress_overall" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profiles" ("id") ON DELETE CASCADE,
  "assessment_text" text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- progress_modules table - tracks progress per module
CREATE TABLE IF NOT EXISTS "progress_modules" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "progress_overall_id" bigint NOT NULL REFERENCES "progress_overall" ("id") ON DELETE CASCADE,
  "module_id" bigint NOT NULL REFERENCES "modules" ("id") ON DELETE CASCADE,
  "assessment_text" text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "progress_overall_profile_id_idx" ON "progress_overall" ("profile_id");
CREATE INDEX IF NOT EXISTS "progress_modules_progress_overall_id_idx" ON "progress_modules" ("progress_overall_id");
CREATE INDEX IF NOT EXISTS "progress_modules_module_id_idx" ON "progress_modules" ("module_id");