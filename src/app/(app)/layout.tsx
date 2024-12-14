import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import type { NavItem } from "@/types/nav";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";

// Define navigation structure without icons
export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/home",
    iconKey: "home",
  },
  {
    title: "Explore",
    url: "/explore",
    iconKey: "search",
  },
  {
    title: "Trainings",
    url: "/trainings",
    iconKey: "book",
  },
  {
    title: "Settings",
    url: "#",
    iconKey: "settings",
    items: [
      {
        title: "General",
        url: "/settings/general",
      },
      {
        title: "Team",
        url: "/settings/team",
      },
      {
        title: "Billing",
        url: "/settings/billing",
      },
      {
        title: "Limits",
        url: "/settings/limits",
      },
    ],
  },
];

function SidebarSkeleton() {
  return (
    <div className="flex h-full w-[14rem] flex-col bg-sidebar p-2 gap-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="flex-1 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Read cookie server-side
  const cookieStore = cookies();
  const sidebarState = cookieStore.get("sidebar:state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Suspense fallback={<SidebarSkeleton />}>
        {/* @ts-expect-error Async Server Component */}
        <AppSidebar navItems={navItems} />
      </Suspense>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNav />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <main className="flex-1">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
