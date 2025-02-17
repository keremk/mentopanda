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
import type { NavItem } from "@/types/nav";
import { getCurrentUserAction } from "@/app/actions/user-actions";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[];
}

export async function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  const userInfo = await getCurrentUserAction();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTop title="MentoPanda" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userInfo.displayName,
            email: userInfo.email,
            avatarUrl: userInfo.avatarUrl,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
