"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ManageTabs() {
  const pathname = usePathname();

  // Set the active tab based on the current path
  const getActiveTab = () => {
    if (pathname.includes("/invite-codes")) return "invite-codes";
    if (pathname.includes("/waitlist")) return "waitlist";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="bg-transparent h-full">
        <TabsTrigger
          value="dashboard"
          asChild
          className="data-[state=active]:bg-background data-[state=active]:shadow-none"
        >
          <Link href="/manage">Dashboard</Link>
        </TabsTrigger>
        <TabsTrigger
          value="invite-codes"
          asChild
          className="data-[state=active]:bg-background data-[state=active]:shadow-none"
        >
          <Link href="/manage/invite-codes">Invite Codes</Link>
        </TabsTrigger>
        <TabsTrigger
          value="waitlist"
          asChild
          className="data-[state=active]:bg-background data-[state=active]:shadow-none"
        >
          <Link href="/manage/waitlist">Waiting List</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
