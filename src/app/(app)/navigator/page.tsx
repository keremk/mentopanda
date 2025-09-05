import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { Navigator } from "./navigator";
import { ContinueButton } from "./continue-button";
import { getUserTrainingStatusAction } from "@/app/actions/history-actions";
import {
  getRandomModuleRecommendationAction,
  getOnboardingModuleRecommendationAction,
} from "@/app/actions/moduleActions";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { AgentActionsProvider } from "@/contexts/agent-actions-context";

export const metadata: Metadata = {
  title: "Mentor Agent",
};

type NavigatorPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NavigatorPage({
  searchParams,
}: NavigatorPageProps) {
  const resolvedSearchParams = await searchParams;
  const isOnboarding = resolvedSearchParams.onboarding === "true";

  // Fetch the actual data objects on the server
  const [userStatus, moduleRecommendation, currentUser] = await Promise.all([
    getUserTrainingStatusAction(),
    isOnboarding
      ? getOnboardingModuleRecommendationAction()
      : getRandomModuleRecommendationAction(),
    getCurrentUserActionCached(),
  ]);

  return (
    <AgentActionsProvider>
      <div className="container mx-auto px-4 py-2">
        <div className="absolute top-0 right-0 p-4 z-10">
          <div className="flex gap-2">
            <Button asChild variant="ghost-brand">
              <Link href="/home" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <ContinueButton />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-brand mb-4">
            {isOnboarding
              ? "Welcome! Let's Start Your Training Journey"
              : "Meet your Mentor Agent"}
          </h1>
          <div className="w-full max-w-3xl">
            <Navigator
              userStatus={userStatus}
              moduleRecommendation={moduleRecommendation}
              isOnboarding={isOnboarding}
              userName={currentUser.email?.split('@')[0] || currentUser.id.toString()}
            />
          </div>
        </div>
      </div>
    </AgentActionsProvider>
  );
}
