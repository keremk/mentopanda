/**
 * Utility functions for managing invite code validation session state
 */

const INVITE_CODE_SESSION_KEY = "validatedInviteCode";

export function storeValidatedInviteCode(inviteCode: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(INVITE_CODE_SESSION_KEY, inviteCode);
  }
}

export function getValidatedInviteCode(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(INVITE_CODE_SESSION_KEY);
  }
  return null;
}

export function clearValidatedInviteCode(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(INVITE_CODE_SESSION_KEY);
  }
}

export function hasValidatedInviteCode(): boolean {
  return getValidatedInviteCode() !== null;
}
