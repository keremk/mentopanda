"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface SidebarItem {
  icon: React.ElementType;
  title: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, title: "Home", href: "/" },
  { icon: Users, title: "Actors", href: "/actors" },
  { icon: MessageSquare, title: "Chat", href: "/chat" },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  function toggleSidebar() {
    setIsExpanded(!isExpanded);
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-gray-100 transition-all duration-300 ease-in-out",
        isExpanded ? "w-[150px]" : "w-16"
      )}
    >
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 p-2">
          {sidebarItems.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center p-2 rounded-lg hover:bg-gray-200 transition-colors",
                  isExpanded ? "justify-start" : "justify-center"
                )}
              >
                <item.icon className="w-6 h-6" />
                {isExpanded && <span className="ml-3">{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
