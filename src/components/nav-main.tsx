"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { Home, Search, BookOpen, Settings2, PieChart, Users } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { NavItem } from "@/types/nav"

// Icon mapping on the client side
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  search: Search,
  book: BookOpen,
  characters: Users,
  settings: Settings2,
  piechart: PieChart,
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  // Helper function to check if a path is active
  const isActivePath = (itemUrl: string) => {
    // Exact match for home page
    if (itemUrl === "/home" && pathname === "/home") return true
    // For other pages, check if the pathname starts with the itemUrl
    // This handles nested routes and sub-items
    return itemUrl !== "/home" && pathname.startsWith(itemUrl)
  }

  // Helper function to check if any child item is active
  const hasActiveChild = (subItems?: { url: string }[]) => {
    return subItems?.some((item) => isActivePath(item.url)) ?? false
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const Icon = iconMap[item.iconKey]
          const isActive = isActivePath(item.url) || hasActiveChild(item.items)

          return hasSubItems ? (
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
                          className={isActivePath(subItem.url) ? "text-blue-500" : ""}
                        >
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a
                  href={item.url}
                  className={`flex items-center ${
                    isActive ? "text-blue-500" : ""
                  }`}
                >
                  {Icon && <Icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
