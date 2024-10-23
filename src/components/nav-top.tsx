"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function NavTop({
  title,
  logo: Logo,
}: {
  title: string;
  logo: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-secondary text-sidebar-primary-foreground">
              <Image
                src="/logo.svg"
                alt="MentoPanda Logo"
                width={64}
                height={64}
                className="transition-all duration-300 ease-in-out w-12 h-12"
              />
            </div>
            <div className="grid flex-1 text-left text-lg leading-tight">
              <span className="truncate font-semibold">{title}</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
