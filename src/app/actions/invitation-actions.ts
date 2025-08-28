"use server";

import {
  createInvitation,
  deleteInvitation,
  Invitation,
  acceptInvitation,
  getInvitationById,
  getInvitationsForUser,
} from "@/data/invitations";
import { User, UserRole } from "@/data/user";
import { createClient } from "@/utils/supabase/server";
import { z } from 'zod/v3';
import { Resend } from "resend";
import InviteEmail from "@/emails/invite-email";
import React from "react";
import { logger } from "@/lib/logger";

const createInvitationSchema = z.object({
  inviteeEmail: z.string().email(),
});

export async function createInvitationAction(
  inviteeEmail: string,
  role: UserRole,
  subject: string,
) {
  const supabase = await createClient();
  const validated = createInvitationSchema.parse({ inviteeEmail });

  let invitation: Invitation | null = null;
  try {
    invitation = await createInvitation(
      supabase,
      validated.inviteeEmail,
      role,
    );
    const emailTemplate = getInviteEmailTemplate(invitation);
    await sendInviteEmailAction(invitation, subject, emailTemplate);
  } catch (error) {
    logger.error("Failed to create invitation", error);  
    if (invitation) {
      await deleteInvitation(supabase, invitation.id);
    }
    throw new Error("Failed to create invitation");
  }
}

export async function resendInviteEmailAction(
  invitationId: number,
  subject: string,
) {
  const supabase = await createClient();
  const invitation = await getInvitationById(supabase, invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  const emailTemplate = getInviteEmailTemplate(invitation);
  return await sendInviteEmailAction(
    invitation,
    subject,
    emailTemplate
  );
}

function getInviteEmailTemplate(
  invitation: Invitation,
) {
  return InviteEmail({
    inviterName: invitation.inviterDisplayName,
    inviterEmail: invitation.inviterEmail,
    inviteLink: `${process.env.NEXT_PUBLIC_SITE_URL}/login?mode=signup`
  });
}

export async function deleteInvitationAction(invitationId: number) {
  const supabase = await createClient();
  return await deleteInvitation(supabase, invitationId);
}

export async function getInvitationsForUserAction(
  user: User
): Promise<Invitation[] | null> {
  const supabase = await createClient();
  return await getInvitationsForUser(supabase, user);
}

export async function acceptInvitationAction(invitation: Invitation, projectId?: number) {
  const supabase = await createClient();
  return await acceptInvitation(supabase, invitation.id, projectId);
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
  if (process.env.NODE_ENV === "development") {
    return "123";
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "MentoPanda <onboarding@transactional.mentopanda.com>",
    to: [invitation.inviteeEmail],
    subject: subject,
    react: emailTemplate,
  });

  logger.debug("data", data);  
  logger.debug("error", error);

  if (error) {
    logger.error(`Failed to send invite email: ${error}`);
    throw new Error(`Failed to send invite email: ${error}`);
  }

  if (!data || !data.id) {
    logger.error("Failed to send invite email with a valid trackingid");
    throw new Error("Failed to send invite email");
  }

  return data.id;
}
