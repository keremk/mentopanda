"use client";

import { SpeakingBubble } from "@/components/speaking-bubble";
import { AgentActions } from "@/components/agent-actions";
import { useOpenAIAgents } from "@/hooks/use-openai-agents";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const AVATAR_URL =
  "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars//gopanda.png";

// Simple GreetingAgent configuration
const GREETING_AGENT_CONFIG = {
  name: "GreetingAgent",
  instructions:
    "You are a friendly greeting agent. Your role is to warmly welcome users and introduce yourself. Keep your responses brief, enthusiastic, and welcoming. Always greet users with energy and ask how you can help them today.",
};

export function MentorAgent() {
  const [showAvatar, setShowAvatar] = useState(false);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    error,
    audioRef,
  } = useOpenAIAgents(GREETING_AGENT_CONFIG);

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
              ? "🗣️ AI is speaking..."
              : "🎤 Listening... Start talking!"}
          </div>
        )}
      </div>

      <AgentActions />

      {/* Hidden audio element for future use */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
