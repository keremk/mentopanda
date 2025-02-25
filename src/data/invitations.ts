import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getCurrentUserInfo, getUserId, UserRole } from "./user";

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
  role: UserRole
): Promise<Invitation> {
  const user = await getCurrentUserInfo(supabase);

  if (!user.currentProject) {
    throw new Error("User must belong to a project to invite others");
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      project_id: user.currentProject.id,
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

export async function checkCurrentUserInvitations(
  supabase: SupabaseClient,
): Promise<Invitation[] | null> {
  const user = await getCurrentUserInfo(supabase);

  const { data, error } = await supabase
    .from("invitations")
    .select(`
      id,
      project_id,
      inviter_id,
      invitee_email,
      inviter_display_name,
      inviter_email,
      role,
      created_at,
      updated_at
    `)
    .eq("invitee_email", user.email)

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

export async function deleteInvitation(
  supabase: SupabaseClient,
  invitationId: number
) {
  const { error } = await supabase.from("invitations").delete().eq("id", invitationId);
  if (error) handleError(error);
}

export async function acceptInvitation(
  supabase: SupabaseClient,
  invitationId: number
): Promise<boolean> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_id: invitationId,
    user_id: userId,
  });

  if (error) handleError(error);
  if (data === null) throw new Error("Failed to accept invitation");

  return data;
}