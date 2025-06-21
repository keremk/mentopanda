"use client";

import { type LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  Settings2,
  PieChart,
  Users,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav";
import { AppPermission } from "@/data/user";
import { useIsMobile } from "@/hooks/use-mobile";

// Icon mapping on the client side
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  search: BookOpen,
  book: GraduationCap,
  users: Users,
  settings: Settings2,
  piechart: PieChart,
  dashboard: LayoutDashboard,
};

export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/home",
    iconKey: "home",
    permissions: ["basic.access"],
  },
  {
    title: "Trainings",
    url: "/explore",
    iconKey: "search",
    permissions: ["basic.access"],
  },
  {
    title: "Enrollments",
    url: "/enrollments",
    iconKey: "book",
    permissions: ["basic.access"],
  },
  {
    title: "Team",
    url: "/team",
    iconKey: "users",
    permissions: ["project.member.manage"],
    hideOnMobile: true,
  },
  {
    title: "Settings",
    url: "/settings/account",
    iconKey: "settings",
    permissions: ["basic.access"],
  },
  {
    title: "Manage",
    url: "/manage",
    iconKey: "dashboard",
    permissions: ["trials.manage"],
  },
];

export function NavMain({ permissions }: { permissions: AppPermission[] }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  // Helper function to check if a path is active
  const isActivePath = (itemUrl: string) => {
    // Exact match for home page
    if (itemUrl === "/home" && pathname === "/home") return true;
    // For other pages, check if the pathname starts with the itemUrl
    // This handles nested routes and sub-items
    return itemUrl !== "/home" && pathname.startsWith(itemUrl);
  };

  // Helper function to check if any child item is active
  const hasActiveChild = (subItems?: { url: string }[]) => {
    return subItems?.some((item) => isActivePath(item.url)) ?? false;
  };

  const availableItems = navItems.filter((item) => {
    if (isMobile && item.hideOnMobile) {
      return false;
    }
    if (item.permissions) {
      return item.permissions.some((permission) =>
        permissions.includes(permission)
      );
    }
    return true;
  });

  return (
    <SidebarGroup>
      <SidebarMenu>
        {availableItems.map((item) => {
          const Icon = iconMap[item.iconKey];
          const isActive = isActivePath(item.url) || hasActiveChild(item.items);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  href={item.url}
                  className={`flex items-center ${
                    isActive
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/60"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={
                        isActive ? "text-brand" : "text-sidebar-foreground/60"
                      }
                    />
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
