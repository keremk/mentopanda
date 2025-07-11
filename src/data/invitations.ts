import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId, UserRole, User, getCurrentUserInfo } from "./user";
import { logger } from "@/lib/logger";

export type Invitation = {
  id: number;
  projectId: number;
  inviterId: string;
  inviteeEmail: string;
  inviterDisplayName: string;
  inviterEmail: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export async function createInvitation(
  supabase: SupabaseClient,
  inviteeEmail: string,
  role: UserRole = "admin"
): Promise<Invitation> {
  const user = await getCurrentUserInfo(supabase);

  if (!user.currentProject) {
    throw new Error("User must belong to a project to invite others");
  }
  const projectId = user.currentProject.id;

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      project_id: projectId,
      inviter_id: user.id,
      invitee_email: inviteeEmail,
      inviter_display_name: user.displayName,
      inviter_email: user.email,
      role: role,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create invitation");

  return {
    id: data.id,
    projectId: data.project_id,
    inviterId: data.inviter_id,
    inviteeEmail: data.invitee_email,
    inviterDisplayName: data.inviter_display_name,
    inviterEmail: data.inviter_email,
    role: data.role,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getInvitationsForUser(
  supabase: SupabaseClient,
  user: User
): Promise<Invitation[] | null> {
  const { data, error } = await supabase
    .from("invitations")
    .select(
      `
      id,
      project_id,
      inviter_id,
      invitee_email,
      inviter_display_name,
      inviter_email,
      role,
      created_at,
      updated_at
    `
    )
    .eq("invitee_email", user.email);

  if (error) handleError(error);
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((invitation: any) => ({
    id: invitation.id,
    projectId: invitation.project_id,
    inviterId: invitation.inviter_id,
    inviteeEmail: invitation.invitee_email,
    inviterDisplayName: invitation.inviter_display_name,
    inviterEmail: invitation.inviter_email,
    role: invitation.role,
    createdAt: invitation.created_at,
    updatedAt: invitation.updated_at,
  }));
  // eslint-enable @typescript-eslint/no-explicit-any
}

export async function getInvitationById(
  supabase: SupabaseClient,
  invitationId: number
): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from("invitations")
    .select()
    .eq("id", invitationId)
    .single();
  if (error) handleError(error);
  if (!data) return null;

  return {
    id: data.id,
    projectId: data.project_id,
    inviterId: data.inviter_id,
    inviteeEmail: data.invitee_email,
    inviterDisplayName: data.inviter_display_name,
    inviterEmail: data.inviter_email,
    role: data.role,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteInvitation(
  supabase: SupabaseClient,
  invitationId: number
) {
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);
  if (error) handleError(error);
}

export async function acceptInvitation(
  supabase: SupabaseClient,
  invitationId: number,
  projectId?: number
): Promise<boolean> {
  const userId = await getUserId(supabase);

  logger.debug(`Accepting invitation ${invitationId} for user ${userId}`);
  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_id: invitationId,
    user_id: userId,
    p_project_id: projectId,
  });

  if (error) handleError(error);
  if (data === null) throw new Error("Failed to accept invitation");

  return data;
}
