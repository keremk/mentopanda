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
import { FeedbackButton } from "@/components/feedback-button";
import { Suspense } from "react";
import { User } from "@/data/user";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  userInfo: User;
};

export function AppSidebar({ userInfo, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTop title="MentoPanda" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain permissions={userInfo.permissions} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-4">
        <Suspense
          fallback={<div className="h-9 animate-pulse bg-muted rounded" />}
        >
          <FeedbackButton />
        </Suspense>
        <NavUser
          user={{
            name: userInfo.displayName,
            email: userInfo.email,
            avatarUrl: userInfo.avatarUrl,
            projectName: userInfo.currentProject.name,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
