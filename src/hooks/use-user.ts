"use client";

import { createClient } from "@/utils/supabase/client";
import { User, getCurrentUserInfo } from "@/data/user";
import { useEffect, useState } from "react";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const userInfo = await getCurrentUserInfo(supabase);
        setUser(userInfo);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading };
} 