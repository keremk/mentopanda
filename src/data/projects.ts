import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId, UserRole } from "./user";
import { logger } from "@/lib/logger";
import { getPathFromStorageUrl } from "@/lib/utils";

export type ProjectSummary = {
  id: number;
  name: string;
};

export type ProjectMemberSummary = {
  id: string;
  role: UserRole;
};

export type ProjectMember = ProjectMemberSummary & {
  name: string;
  email: string;
  avatar_url: string;
};

export async function createProject(
  supabase: SupabaseClient,
  name: string
): Promise<ProjectSummary> {
  const { data: projectId, error } = await supabase.rpc("create_project", {
    project_name: name,
  });

  logger.debug(`Project ID: ${projectId}`);
  if (error) handleError(error);
  if (!projectId) throw new Error("Failed to create project");

  logger.debug(`Created project with name: ${name} and id: ${projectId}`);
  return {
    id: projectId,
    name: name,
  };
}

export async function getProjects(
  supabase: SupabaseClient
): Promise<ProjectSummary[]> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      projects_profiles!inner (
        profile_id
      )
    `
    )
    .eq("projects_profiles.profile_id", userId);

  if (error) handleError(error);
  if (!data) throw new Error("Failed to list projects");

  return data.map((project) => ({
    id: project.id,
    name: project.name,
  }));
}

// Add this new function for copying storage files during deep copy
async function copyStorageFile(
  supabase: SupabaseClient,
  sourceUrl: string | null,
  sourceBucket: string,
  targetPath: string
): Promise<string | null> {
  if (!sourceUrl) return null;

  try {
    // Extract the source path from the URL
    const sourcePath = getPathFromStorageUrl(sourceUrl);
    if (!sourcePath) {
      logger.warn(`Could not extract path from URL: ${sourceUrl}`);
      return sourceUrl; // Return original URL if we can't parse it
    }

    // Download the file from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError) {
      logger.error(`Failed to download file ${sourcePath}:`, downloadError);
      return sourceUrl; // Return original URL on error
    }

    // Upload to new path
    const { error: uploadError } = await supabase.storage
      .from(sourceBucket)
      .upload(targetPath, fileData, {
        upsert: true,
        contentType: fileData.type,
      });

    if (uploadError) {
      logger.error(`Failed to upload file to ${targetPath}:`, uploadError);
      return sourceUrl; // Return original URL on error
    }

    // Generate the new public URL
    const { data: publicUrlData } = supabase.storage
      .from(sourceBucket)
      .getPublicUrl(targetPath);

    logger.debug(
      `Successfully copied storage file: ${sourcePath} -> ${targetPath}`
    );
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error(`Unexpected error copying storage file:`, error);
    return sourceUrl; // Return original URL on error
  }
}

export async function copyPublicTrainings(
  supabase: SupabaseClient,
  projectId: number,
  userId: string
) {
  logger.debug(
    `Copying public trainings to project ${projectId} for user ${userId}`
  );

  // First, get all the data we need to copy storage files
  const { data: sourceData, error: sourceError } = await supabase
    .from("trainings")
    .select(
      `
      id,
      title,
      tagline,
      description,
      image_url,
      preview_url,
      modules (
        id,
        modules_characters (
          characters (
            id,
            avatar_url
          )
        )
      )
    `
    )
    .eq("project_id", 1); // Public project ID

  if (sourceError) {
    logger.error("Failed to fetch source training data:", sourceError);
    throw sourceError;
  }

  // Call the original deep copy function
  const { error: copyError } = await supabase.rpc("deep_copy_project", {
    source_project_id: 1, // Public project ID
    target_project_id: projectId,
    target_user_id: userId,
  });

  if (copyError) {
    logger.error("Deep copy failed:", copyError);
    throw copyError;
  }

  // Now get the newly created trainings to update their storage URLs
  const { data: newTrainings, error: newTrainingsError } = await supabase
    .from("trainings")
    .select(
      `
      id,
      title,
      image_url,
      preview_url,
      modules (
        id,
        modules_characters (
          characters (
            id,
            avatar_url
          )
        )
      )
    `
    )
    .eq("project_id", projectId)
    .eq("created_by", userId);

  if (newTrainingsError) {
    logger.error("Failed to fetch new training data:", newTrainingsError);
    throw newTrainingsError;
  }

  // Copy storage files and update URLs
  const storageUpdatePromises: Promise<void>[] = [];

  for (let i = 0; i < sourceData.length && i < newTrainings.length; i++) {
    const sourceTraining = sourceData[i];
    const newTraining = newTrainings[i];

    // Copy training images
    if (sourceTraining.image_url) {
      const copyPromise = copyStorageFile(
        supabase,
        sourceTraining.image_url,
        "trainings",
        `trainings/${newTraining.id}/cover.jpg`
      ).then(async (newUrl) => {
        if (newUrl && newUrl !== sourceTraining.image_url) {
          await supabase
            .from("trainings")
            .update({ image_url: newUrl })
            .eq("id", newTraining.id);
        }
      });
      storageUpdatePromises.push(copyPromise);
    }

    if (sourceTraining.preview_url) {
      const copyPromise = copyStorageFile(
        supabase,
        sourceTraining.preview_url,
        "trainings",
        `trainings/${newTraining.id}/preview.jpg`
      ).then(async (newUrl) => {
        if (newUrl && newUrl !== sourceTraining.preview_url) {
          await supabase
            .from("trainings")
            .update({ preview_url: newUrl })
            .eq("id", newTraining.id);
        }
      });
      storageUpdatePromises.push(copyPromise);
    }

    // Copy character avatars
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sourceCharacters =
      sourceTraining.modules?.flatMap(
        (m: any) =>
          m.modules_characters
            ?.map((mc: any) => mc.characters)
            .filter(Boolean) || []
      ) || [];

    const newCharacters =
      newTraining.modules?.flatMap(
        (m: any) =>
          m.modules_characters
            ?.map((mc: any) => mc.characters)
            .filter(Boolean) || []
      ) || [];

    for (
      let j = 0;
      j < sourceCharacters.length && j < newCharacters.length;
      j++
    ) {
      const sourceChar = sourceCharacters[j];
      const newChar = newCharacters[j];

      if (sourceChar?.avatar_url) {
        const copyPromise = copyStorageFile(
          supabase,
          sourceChar.avatar_url,
          "avatars",
          `character-avatars/${newChar.id}/avatar.jpg`
        ).then(async (newUrl) => {
          if (newUrl && newUrl !== sourceChar.avatar_url) {
            await supabase
              .from("characters")
              .update({ avatar_url: newUrl })
              .eq("id", newChar.id);
          }
        });
        storageUpdatePromises.push(copyPromise);
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  // Wait for all storage operations to complete
  await Promise.allSettled(storageUpdatePromises);

  logger.debug("Finished copying content with storage files");
}

export async function getProjectMembers(
  supabase: SupabaseClient,
  projectId: number
): Promise<ProjectMember[]> {
  const { data, error } = await supabase.rpc("get_project_members", {
    p_project_id: projectId,
  });

  if (error) handleError(error);
  if (!data) throw new Error("Failed to get project members");
  if (data.status === "error") throw new Error(data.message);

  // The function returns { status: 'success', data: [...members] }
  const members = data.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return members.map((member: any) => ({
    id: member.user_id,
    name: member.display_name || member.email.split("@")[0],
    email: member.email,
    role: member.role,
    avatar_url: member.avatar_url || "",
  }));
  // eslint-enable @typescript-eslint/no-explicit-any
}

export async function getProjectMemberInfo(
  supabase: SupabaseClient,
  projectId: number,
  userId: string
): Promise<ProjectMember | null> {
  const { data, error } = await supabase.rpc("get_project_member_info", {
    p_project_id: projectId,
    p_user_id: userId,
  });

  if (error) handleError(error);
  if (!data) throw new Error("Failed to get project member info");
  if (data.status === "error") throw new Error(data.message);

  // The function returns { status: 'success', data: memberInfo }
  const memberInfo = data.data;

  // Return null if no member was found
  if (!memberInfo) return null;

  return {
    id: memberInfo.user_id,
    name: memberInfo.display_name || memberInfo.email.split("@")[0],
    email: memberInfo.email,
    role: memberInfo.role,
    avatar_url: memberInfo.avatar_url || "",
  };
}

export async function updateProjectMemberRole(
  supabase: SupabaseClient,
  projectId: number,
  userId: string,
  role: UserRole
): Promise<ProjectMemberSummary> {
  const { data, error } = await supabase
    .from("projects_profiles")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("profile_id", userId)
    .select("profile_id, role")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update project member role");

  return {
    id: data.profile_id,
    role: data.role,
  };
}

export async function addProjectMember(
  supabase: SupabaseClient,
  projectId: number,
  userId: string,
  role: UserRole
): Promise<ProjectMemberSummary> {
  logger.debug(
    `Adding project member ${userId} to project ${projectId} with role ${role}`
  );
  const { data, error } = await supabase
    .from("projects_profiles")
    .insert({
      project_id: projectId,
      profile_id: userId,
      role: role,
    })
    .select(`profile_id, role`)
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to add project member");

  return {
    id: data.profile_id,
    role: data.role,
  };
}
