"use client";

import * as React from "react";
import {
  Home,
  Search,
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

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
import { User } from "@supabase/supabase-js";
import type { NavItem } from "@/types/nav";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[]
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const userInfo = {
    name: user?.user_metadata.full_name || user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatarUrl: user?.user_metadata.avatar_url || "/placeholder.svg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTop title="MentoPanda" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
