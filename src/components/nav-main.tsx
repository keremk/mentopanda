"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  Settings2,
  PieChart,
  Users,
  GraduationCap,
  Bot,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types/nav";
import { useEffect, useState } from "react";
import { AppPermission } from "@/data/user";

// Icon mapping on the client side
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  search: BookOpen,
  book: GraduationCap,
  characters: Bot,
  users: Users,
  settings: Settings2,
  piechart: PieChart,
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
    title: "Characters",
    url: "/characters",
    iconKey: "characters",
    permissions: ["training.manage"],
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
  },
  {
    title: "Settings",
    url: "/settings/account",
    iconKey: "settings",
    permissions: ["basic.access"],
  },
];

export function NavMain({ permissions }: { permissions: AppPermission[] }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isOnboarding = isClient && pathname.includes("/onboard");

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

  const handleClick = (e: React.MouseEvent) => {
    if (isOnboarding) {
      e.preventDefault();
    }
  };

  const availableItems = navItems.filter((item) => {
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
          const hasSubItems = item.items && item.items.length > 0;
          const Icon = iconMap[item.iconKey];
          const isActive = isActivePath(item.url) || hasActiveChild(item.items);

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={isActive ? "text-blue-500" : ""}
                    >
                      {Icon && <Icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={
                              isActivePath(subItem.url) ? "text-blue-500" : ""
                            }
                          >
                            <Link href={subItem.url} onClick={handleClick}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  href={item.url}
                  onClick={handleClick}
                  className={`flex items-center ${
                    isActive ? "text-blue-500" : ""
                  }`}
                >
                  {Icon && <Icon />}
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
