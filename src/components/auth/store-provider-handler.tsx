"use client";

import { useStoreAuthProvider } from "@/hooks/use-store-auth-provider";

/**
 * A client component that runs the useStoreAuthProvider hook
 * to handle storing the provider from URL query params.
 * Renders nothing.
 */
export function StoreProviderHandler() {
  useStoreAuthProvider();
  return null;
}
