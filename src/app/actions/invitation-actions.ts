"use server";

import {
  checkCurrentUserInvitations,
  createInvitation,
  deleteInvitation,
  Invitation,
  acceptInvitation,
} from "@/data/invitations";
import { UserRole } from "@/data/user";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const createInvitationSchema = z.object({
  inviteeEmail: z.string().email(),
});

export async function createInvitationAction(inviteeEmail: string, role: UserRole) {
  const supabase = await createClient();
  const validated = createInvitationSchema.parse({ inviteeEmail });
  return await createInvitation(supabase, validated.inviteeEmail, role);
}

export async function deleteInvitationAction(invitationId: number) {
  const supabase = await createClient();
  return await deleteInvitation(supabase, invitationId);
}

export async function checkCurrentUserInvitationsAction() {
  const supabase = await createClient();
  return await checkCurrentUserInvitations(supabase);
}

export async function acceptInvitationAction(invitation: Invitation) {
  const supabase = await createClient();
  return await acceptInvitation(supabase, invitation.id);
}

export async function declineInvitationAction(invitation: Invitation) {
  const supabase = await createClient();
  return await deleteInvitation(supabase, invitation.id);
}
