"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ManageTabs() {
  const pathname = usePathname();

  // Set the active tab based on the current path
  const activeTab = pathname.includes("/trials") ? "trials" : "dashboard";

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="bg-transparent h-full">
        <Link href="/manage" passHref legacyBehavior>
          <TabsTrigger
            value="dashboard"
            asChild
            className="data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <a>Dashboard</a>
          </TabsTrigger>
        </Link>
        <Link href="/manage/trials" passHref legacyBehavior>
          <TabsTrigger
            value="trials"
            asChild
            className="data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <a>Trial Invitations</a>
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}
