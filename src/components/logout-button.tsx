"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    console.log("LogoutButton clicked");
    try {
      const supabase = createClient();
      console.log("Supabase client created");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        console.log("Successfully signed out");
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
      onMouseDown={() => console.log("Button pressed")}
      onMouseUp={() => console.log("Button released")}
    >
      Logout
    </Button>
  );
}
