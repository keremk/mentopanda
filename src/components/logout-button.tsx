"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        // Redirect to the login page
        router.push("/login");
      }
    } catch (error) {
      console.error("Error in handleLogout:", error);
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
