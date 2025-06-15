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
        <Link href="/manage" passHref legacyBehavior>
          <TabsTrigger
            value="dashboard"
            asChild
            className="data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <a>Dashboard</a>
          </TabsTrigger>
        </Link>
        <Link href="/manage/invite-codes" passHref legacyBehavior>
          <TabsTrigger
            value="invite-codes"
            asChild
            className="data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <a>Invite Codes</a>
          </TabsTrigger>
        </Link>
        <Link href="/manage/waitlist" passHref legacyBehavior>
          <TabsTrigger
            value="waitlist"
            asChild
            className="data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <a>Waiting List</a>
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}
