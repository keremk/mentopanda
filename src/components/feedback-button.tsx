"use client";

import { MessageSquarePlus } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function FeedbackButton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="flex items-center"
          id="posthog-feedback-button" // Unique ID for PostHog to target
        >
          <MessageSquarePlus className="h-[1.2rem] w-[1.2rem]" />
          <span>Feedback</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
