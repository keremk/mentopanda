'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserIcon, SettingsIcon, HelpCircleIcon, LogOutIcon } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"


interface UserMenubarProps {
  isExpanded: boolean
}

export function UserMenubar({ isExpanded }: UserMenubarProps) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-full flex items-center justify-start p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          {isExpanded && <span className="ml-2 text-sm">user@example.com</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align={isExpanded ? "end" : "start"} 
        alignOffset={isExpanded ? -40 : 8} 
        sideOffset={isExpanded ? 10 : 0}
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User</p>
            <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HelpCircleIcon className="mr-2 h-4 w-4" />
          <span>Help</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onSelect={handleLogout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}