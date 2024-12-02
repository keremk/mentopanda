"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavTop } from "@/components/nav-top";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { NavItem } from "@/types/nav";
import getCurrentUserInfo, { User } from "@/data/user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[]
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  const [userInfo, setUserInfo] = useState<User>({
    id: "",
    email: "",
    displayName: "User",
    avatarUrl: "/placeholder.svg"
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUserInfo(supabase);
        setUserInfo(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    }
    loadUser();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTop title="MentoPanda" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: userInfo.displayName,
          email: userInfo.email,
          avatarUrl: userInfo.avatarUrl
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
