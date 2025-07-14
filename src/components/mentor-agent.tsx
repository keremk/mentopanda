"use client";

import { SpeakingBubble } from "@/components/speaking-bubble";
import { AgentActions } from "@/components/agent-actions";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { useOpenAIAgents } from "@/hooks/use-openai-agents";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { RealtimeAgent } from "@openai/agents/realtime";
import { logger } from "@/lib/logger";

const AVATAR_URL =
  "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars//gopanda.png";

export type MentorAgentProps = {
  agentFactory: () => Promise<RealtimeAgent>;
};

export function MentorAgent({ agentFactory }: MentorAgentProps) {
  const [agent, setAgent] = useState<RealtimeAgent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    error,
    audioRef,
  } = useOpenAIAgents(agent || ({} as RealtimeAgent));

  // Initialize the agent when component mounts
  useEffect(() => {
    async function initializeAgent() {
      setIsLoadingAgent(true);
      setAgentError(null);

      try {
        logger.debug("🔄 Starting agent initialization...");
        const createdAgent = await agentFactory();
        logger.debug("🤖 Agent created:", createdAgent);
        setAgent(createdAgent);
      } catch (err) {
        logger.error("❌ Failed to initialize agent:", err);
        setAgentError("Failed to load agent data. Please try again.");
      } finally {
        setIsLoadingAgent(false);
      }
    }

    initializeAgent();
  }, [agentFactory]);

  const handleConnect = async () => {
    if (!agent) return;

    logger.debug("🔄 Starting connection process...");
    setShowAvatar(true);
    try {
      await connect();
      logger.debug("✅ Connection successful");
    } catch (err) {
      logger.error("❌ Connection failed:", err);
      setShowAvatar(false);
      // Error handling is now done through the hook's error state and useEffect
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowAvatar(false);
  };

  // Ensure cleanup when component unmounts
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Don't allow interactions when agent is not ready
  const canInteract = agent && !isLoadingAgent && !agentError;

  // Check if current error is credit-related
  const isCreditError = error && error.includes("No credits available");

  // Watch for credit errors from the hook and show dialog
  useEffect(() => {
    if (isCreditError) {
      logger.info("Credit error detected from hook, showing NoCreditsDialog");
      setShowNoCreditsDialog(true);
    }
  }, [isCreditError]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <SpeakingBubble
        audioRef={audioRef}
        isPlaying={canInteract ? isSpeaking : false}
        avatarUrl={AVATAR_URL}
        showAvatar={showAvatar}
      />

      <div className="flex flex-col items-center gap-4">
        {/* Show loading state */}
        {isLoadingAgent && (
          <div className="text-muted-foreground text-sm">
            Preparing your mentor...
          </div>
        )}

        {/* Show agent error */}
        {agentError && (
          <div className="text-red-500 text-sm max-w-md text-center">
            {agentError}
          </div>
        )}

        {/* Show connection error (but not credit errors, those show in dialog) */}
        {error && canInteract && !isCreditError && (
          <div className="text-red-500 text-sm max-w-md text-center">
            {error}
          </div>
        )}

        {/* Show connection buttons when agent is ready */}
        {canInteract && (
          <div className="flex gap-2">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isConnected}
              variant={isConnected ? "ghost-brand" : "brand"}
            >
              {isConnecting
                ? "Connecting..."
                : isConnected
                  ? "Connected"
                  : "Start Conversation"}
            </Button>

            {isConnected && (
              <Button onClick={handleDisconnect} variant="ghost-brand">
                End Conversation
              </Button>
            )}
          </div>
        )}
      </div>

      <AgentActions />

      {/* Hidden audio element for OpenAI SDK */}
      <audio ref={audioRef} className="hidden" />

      {/* No Credits Dialog */}
      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
        title="No Credits Available"
        description="You don't have enough credits to start a conversation. Purchase additional credits to continue using AI features."
      />
    </div>
  );
}
