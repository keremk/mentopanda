"use client";

import { MentorAgent } from "@/components/mentor-agent";
import {
  getTrainingNavigatorAgent,
  DEFAULT_USER_STATUS,
  DEFAULT_RECOMMENDED_MODULE,
} from "@/prompts/training-navigator-agent";
import { UserTrainingStatus } from "@/data/history";
import { RecommendedModule } from "@/prompts/training-navigator-agent";

type NavigatorProps = {
  userStatus: UserTrainingStatus | null;
  moduleRecommendation: RecommendedModule | null;
};

export function Navigator({
  userStatus,
  moduleRecommendation,
}: NavigatorProps) {
  const agentFactory = async () => {
    // Use your existing function with fallbacks
    return getTrainingNavigatorAgent(
      userStatus || DEFAULT_USER_STATUS,
      moduleRecommendation || DEFAULT_RECOMMENDED_MODULE
    );
  };

  return <MentorAgent agentFactory={agentFactory} />;
}
