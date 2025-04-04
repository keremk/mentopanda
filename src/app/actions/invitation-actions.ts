"use server";

import {
  checkCurrentUserInvitations,
  createInvitation,
  deleteInvitation,
  Invitation,
  acceptInvitation,
  getInvitation,
  getTrialInvitations,
} from "@/data/invitations";
import { UserRole } from "@/data/user";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite-email";
import React from "react";
import TrialInviteEmail from "@/emails/trial-invite";
const createInvitationSchema = z.object({
  inviteeEmail: z.string().email(),
});

export async function createInvitationAction(
  inviteeEmail: string,
  role: UserRole,
  subject: string,
  isTrial: boolean = false,
  isPromoInvitation: boolean = false
) {
  const supabase = await createClient();
  const validated = createInvitationSchema.parse({ inviteeEmail });

  let invitation: Invitation | null = null;
  try {
    invitation = await createInvitation(
      supabase,
      validated.inviteeEmail,
      role,
      isTrial,
      isPromoInvitation
    );
    const emailTemplate = getInviteEmailTemplate(invitation, isPromoInvitation);
    await sendInviteEmailAction(invitation, subject, emailTemplate);
  } catch (error) {
    console.error("Failed to create invitation", error);
    if (invitation) {
      await deleteInvitation(supabase, invitation.id);
    }
    throw new Error("Failed to create invitation");
  }
}

export async function resendInviteEmailAction(
  invitationId: number,
  isPromoInvitation: boolean = false
) {
  const supabase = await createClient();
  const invitation = await getInvitation(supabase, invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  const emailTemplate = getInviteEmailTemplate(invitation, isPromoInvitation);
  return await sendInviteEmailAction(
    invitation,
    "Join my project on MentoPanda",
    emailTemplate
  );
}

function getInviteEmailTemplate(
  invitation: Invitation,
  isPromoInvitation: boolean
) {
  if (isPromoInvitation) {
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/mode=signup&invite=${invitation.id}`;
    return TrialInviteEmail({
      inviterName: invitation.inviterDisplayName,
      inviterEmail: invitation.inviterEmail,
      inviteLink: inviteLink,
    });
  } else {
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/mode=signup&invite=${invitation.id}`;
    return InviteEmail({
      inviterName: invitation.inviterDisplayName,
      inviterEmail: invitation.inviterEmail,
      inviteLink: inviteLink,
    });
  }
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

async function sendInviteEmailAction(
  invitation: Invitation,
  subject: string,
  emailTemplate: React.JSX.Element
): Promise<string> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/mode=signup&invite=${invitation.id}`;
  console.log("inviteLink", inviteLink);

  const { data, error } = await resend.emails.send({
    from: "MentoPanda <onboarding@transactional.mentopanda.com>",
    to: [invitation.inviteeEmail],
    subject: subject,
    react: emailTemplate,
  });

  console.log("data", data);
  console.log("error", error);

  if (error) {
    console.error(`Failed to send invite email: ${error}`);
    throw new Error(`Failed to send invite email: ${error}`);
  }

  if (!data || !data.id) {
    console.error("Failed to send invite email with a valid trackingid");
    throw new Error("Failed to send invite email");
  }

  return data.id;
}

export async function getTrialInvitationsAction(): Promise<Invitation[]> {
  const supabase = await createClient();
  return await getTrialInvitations(supabase);
}
