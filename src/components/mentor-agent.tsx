"use client";

import { SpeakingBubble } from "@/components/speaking-bubble";
import { AgentActions } from "@/components/agent-actions";
import { useOpenAIAgents } from "@/hooks/use-openai-agents";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  getGreetingAgent,
  type UserStatus,
  type RecommendedModule,
} from "@/prompts/greeting-agent";
import { getUserStatusForGreetingAction } from "@/app/actions/history-actions";
import { getRandomModuleRecommendationAction } from "@/app/actions/moduleActions";
import { RealtimeAgent } from "@openai/agents/realtime";

const AVATAR_URL =
  "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars//gopanda.png";

// Default fallback data
const DEFAULT_USER_STATUS: UserStatus = {
  hasHadSession: false,
  lastSessionDate: new Date(),
  lastSessionFeedback: "",
  lastSessionModuleId: "",
};

const DEFAULT_RECOMMENDED_MODULE: RecommendedModule = {
  moduleId: "1",
  moduleName: "Welcome Training",
  moduleDescription:
    "A simple introduction to communication skills training to get you started on your learning journey.",
};

// Separate component that handles the agent interaction once agent is ready
function MentorAgentInteraction({ agent }: { agent: RealtimeAgent }) {
  const [showAvatar, setShowAvatar] = useState(false);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    error,
    audioRef,
  } = useOpenAIAgents(agent);

  const handleConnect = async () => {
    setShowAvatar(true);
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setShowAvatar(false);
  };

  // Ensure cleanup when component unmounts (e.g., dialog closing)
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <SpeakingBubble
        audioRef={audioRef}
        isPlaying={isSpeaking}
        avatarUrl={AVATAR_URL}
        showAvatar={showAvatar}
      />

      <div className="flex flex-col items-center gap-4">
        {/* Show connection error */}
        {error && (
          <div className="text-red-500 text-sm max-w-md text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || isConnected}
            variant={isConnected ? "secondary" : "default"}
          >
            {isConnecting
              ? "Connecting..."
              : isConnected
                ? "Connected"
                : "Start Conversation"}
          </Button>

          {isConnected && (
            <Button onClick={handleDisconnect} variant="outline">
              End Conversation
            </Button>
          )}
        </div>

        {isConnected && (
          <div className="text-sm text-muted-foreground text-center">
            {isSpeaking
              ? "🗣️ MentoPanda is speaking..."
              : "🎤 Listening... Start talking!"}
          </div>
        )}
      </div>

      <AgentActions />

      {/* Hidden audio element for OpenAI SDK */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

export function MentorAgent() {
  const [greetingAgent, setGreetingAgent] = useState<RealtimeAgent | null>(
    null
  );
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Initialize the greeting agent with real data
  useEffect(() => {
    async function initializeGreetingAgent() {
      setIsLoadingAgent(true);
      setAgentError(null);

      try {
        // Get user status and module recommendation in parallel
        const [userStatus, moduleRecommendation] = await Promise.all([
          getUserStatusForGreetingAction(),
          getRandomModuleRecommendationAction(),
        ]);

        // Use defaults if we can't get real data
        const finalUserStatus = userStatus || DEFAULT_USER_STATUS;
        const finalModuleRecommendation =
          moduleRecommendation || DEFAULT_RECOMMENDED_MODULE;

        // Create the greeting agent with real data
        const agent = getGreetingAgent(
          finalUserStatus,
          finalModuleRecommendation
        );
        setGreetingAgent(agent);
      } catch (err) {
        console.error("Failed to initialize greeting agent:", err);
        setAgentError(
          "Failed to load agent data. Using default configuration."
        );

        // Fall back to default agent
        const agent = getGreetingAgent(
          DEFAULT_USER_STATUS,
          DEFAULT_RECOMMENDED_MODULE
        );
        setGreetingAgent(agent);
      } finally {
        setIsLoadingAgent(false);
      }
    }

    initializeGreetingAgent();
  }, []);

  // Show loading state while agent is being prepared
  if (isLoadingAgent || !greetingAgent) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <SpeakingBubble
          audioRef={{ current: null }}
          isPlaying={false}
          avatarUrl={AVATAR_URL}
          showAvatar={false}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Preparing your mentor...
          </div>

          {agentError && (
            <div className="text-yellow-600 text-sm max-w-md text-center">
              {agentError}
            </div>
          )}
        </div>

        <AgentActions />
      </div>
    );
  }

  // Render the full interaction component once agent is ready
  return <MentorAgentInteraction agent={greetingAgent} />;
}
