"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { setLastAuthProvider } from "@/lib/store-auth-provider";

/**
 * Reads the 'auth_provider' query parameter on mount,
 * stores it in localStorage, and removes it from the URL.
 */
export function useStoreAuthProvider() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const provider = searchParams.get("auth_provider");

    if (
      provider &&
      (provider === "email" || provider === "github" || provider === "google")
    ) {
      // Store the provider
      setLastAuthProvider(provider);

      // Clean up the URL by removing the query parameter
      // Create a new URLSearchParams object without the auth_provider
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("auth_provider");

      // Use router.replace to update the URL without adding to history
      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      // If no other params left, just use pathname
      const finalUrl = newSearchParams.toString() ? newUrl : pathname;

      router.replace(finalUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]); // Re-run if searchParams change
}
