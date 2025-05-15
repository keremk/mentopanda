"use client"; // Ensure this runs only on the client

import { logger } from "./logger";

const STORAGE_KEY = "lastAuthProvider";

/**
 * Stores the last used authentication provider in localStorage.
 * @param provider - The provider name ('email', 'github', 'google').
 */
export function setLastAuthProvider(
  provider: "email" | "github" | "google"
): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, provider);
    } catch (error) {
      logger.error("Error saving last auth provider to localStorage:", error);
    }
  }
}

/**
 * Retrieves the last used authentication provider from localStorage.
 * @returns The provider name or null if not found or not available.
 */
export function getLastAuthProvider(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      logger.error(
        "Error reading last auth provider from localStorage:",
        error
      );
      return null;
    }
  }
  return null;
}
