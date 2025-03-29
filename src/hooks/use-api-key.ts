import { useState, useEffect } from "react";
import { getStoredApiKey } from "@/lib/apikey";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApiKey() {
      try {
        const key = await getStoredApiKey();
        setApiKey(key || undefined);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchApiKey();
  }, []);

  return {
    apiKey,
    isLoading,
  };
}
