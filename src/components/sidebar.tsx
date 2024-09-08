"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenubar } from "@/components/user-menubar";
import { Home, Search, BookOpen, PenTool, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface SidebarItem {
  icon: React.ElementType;
  title: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, title: "Home", href: "/home" },
  { icon: Search, title: "Explore", href: "/explore" },
  { icon: BookOpen, title: "Train", href: "/train" },
  { icon: PenTool, title: "Create", href: "/create" },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  function toggleSidebar() {
    setIsExpanded(!isExpanded);
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-gray-100 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center p-4">
        <Image
          src="/logo.svg"
          alt="MentoPanda Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        {isExpanded && (
          <>
            <span className="ml-2 font-semibold">MentoPanda</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 p-2">
          {sidebarItems.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center p-2 rounded-lg hover:bg-gray-200 transition-colors",
                  pathname === item.href && "bg-gray-200",
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
      <div className="p-4 relative">
        <UserMenubar isExpanded={isExpanded} />
        {!isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -top-10 left-1/2 transform -translate-x-1/2"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
