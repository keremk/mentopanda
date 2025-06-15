import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/page-title";
import { StoreProviderHandler } from "@/components/auth/store-provider-handler";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";

function SidebarSkeleton() {
  return (
    <div className="flex h-full w-[14rem] flex-col bg-sidebar p-2 gap-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="flex-1 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user data to check onboarding status
  const userInfo = await getCurrentUserActionCached();
  const isOnboardingComplete = userInfo.onboarding === "complete";

  // Read cookie server-side
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar:state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  // If onboarding is not complete, render without sidebar
  if (!isOnboardingComplete) {
    return (
      <div className="flex h-screen w-full">
        <StoreProviderHandler />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  // If onboarding is complete, render with sidebar
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <StoreProviderHandler />
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar userInfo={userInfo} />
      </Suspense>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width] ease-linear pt-4 pb-3">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Suspense
              fallback={
                <div className="h-6 w-32 animate-pulse bg-muted rounded" />
              }
            >
              <PageTitle />
            </Suspense>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-1">
          <main className="flex-1">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
