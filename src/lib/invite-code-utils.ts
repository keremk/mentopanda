import { type InviteCode } from "@/data/invite-codes";

/**
 * Check if an invite code is expired (utility function)
 */
export function isInviteCodeExpired(inviteCode: InviteCode): boolean {
  const createdAt = new Date(inviteCode.created_at);
  const expiryDate = new Date(
    createdAt.getTime() + inviteCode.expire_by * 24 * 60 * 60 * 1000
  );
  const now = new Date();

  return now > expiryDate;
}

/**
 * Get the expiry date of an invite code (utility function)
 */
export function getInviteCodeExpiryDate(inviteCode: InviteCode): Date {
  const createdAt = new Date(inviteCode.created_at);
  return new Date(
    createdAt.getTime() + inviteCode.expire_by * 24 * 60 * 60 * 1000
  );
}
