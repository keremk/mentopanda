"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    try { 
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Error signing out:", error);
      } else {
        // Redirect to the login page
        router.push("/login");
      }
    } catch (error) {
      logger.error("Error in handleLogout:", error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}
