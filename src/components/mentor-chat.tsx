"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { VoiceChat } from "@/components/voice-chat";
import { AgentActions } from "@/components/agent-actions";
import { RealtimeConfig, VoicePrompt } from "@/types/realtime";
import { TranscriptProvider } from "@/contexts/transcript";
import { UsageProvider } from "@/contexts/usage-context";
import { logger } from "@/lib/logger";

const AVATAR_URL =
  "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars//gopanda.png";

export interface MentorChatProps {
  voicePromptFactory: () => Promise<VoicePrompt>;
  endButtonText?: string;
  onEndClick?: () => void;
  userName: string;
}

type MentorChatState = {
  isConversationActive: boolean;
  promptError: string | null;
  isLoadingPrompt: boolean;
};

export function MentorChat({
  voicePromptFactory,
  endButtonText = "End Conversation", 
  onEndClick,
  userName,
}: MentorChatProps) {
  return (
    <TranscriptProvider>
      <UsageProvider>
        <MentorChatContent
          voicePromptFactory={voicePromptFactory}
          endButtonText={endButtonText}
          onEndClick={onEndClick}
          userName={userName}
        />
      </UsageProvider>
    </TranscriptProvider>
  );
}

function MentorChatContent({
  voicePromptFactory,
  onEndClick,
  userName,
}: MentorChatProps) {
  const [chatState, setChatState] = useState<MentorChatState>({
    isConversationActive: false,
    promptError: null,
    isLoadingPrompt: false,
  });

  const [voicePrompt, setVoicePrompt] = useState<VoicePrompt | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize voice prompt when component mounts or factory changes
  const initializePrompt = useCallback(async () => {
    if (voicePrompt) return; // Already initialized
    
    setChatState(prev => ({ ...prev, isLoadingPrompt: true, promptError: null }));
    
    try {
      logger.debug("🔄 Starting prompt initialization...");
      const createdPrompt = await voicePromptFactory();
      logger.debug("🤖 Voice prompt created:", createdPrompt);
      setVoicePrompt(createdPrompt);
    } catch (err) {
      logger.error("❌ Failed to initialize voice prompt:", err);
      setChatState(prev => ({ 
        ...prev, 
        promptError: "Failed to load mentor data. Please try again." 
      }));
    } finally {
      setChatState(prev => ({ ...prev, isLoadingPrompt: false }));
    }
  }, [voicePromptFactory, voicePrompt]);

  // Initialize prompt when component mounts
  React.useEffect(() => {
    initializePrompt();
  }, [initializePrompt]);

  // Create realtime config
  const realtimeConfig: RealtimeConfig | null = useMemo(() => {
    if (!voicePrompt) return null;
    
    return {
      provider: 'openai' as const, // For now, all mentors use OpenAI
      voice: voicePrompt,
      audioRef,
      userName: userName,
      enableTranscription: true,
      enableUsageTracking: true,
    };
  }, [voicePrompt, userName]);

  // Handle conversation lifecycle
  const handleConversationStart = useCallback(async () => {
    try {
      // Initialize prompt if not already done
      if (!voicePrompt) {
        await initializePrompt();
      }
      
      setChatState(prev => ({ ...prev, isConversationActive: true }));
      logger.info("Mentor conversation started");
    } catch (error) {
      logger.error("Failed to start mentor conversation:", error);
      throw error; // Re-throw to prevent connection
    }
  }, [voicePrompt, initializePrompt]);

  const handleConversationEnd = useCallback(async () => {
    setChatState(prev => ({ ...prev, isConversationActive: false }));
    logger.info("Mentor conversation ended");
  }, []);

  const handleVoiceChatStop = useCallback(async (actualStopFn: () => Promise<void>) => {
    // Call the actual stop function to disconnect voice chat
    await actualStopFn();
    
    // Always call parent's onEndClick if provided
    if (onEndClick) {
      onEndClick();
    }
  }, [onEndClick]);


  // Show loading state while prompt is being initialized
  if (chatState.isLoadingPrompt) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-muted-foreground text-sm">
          Preparing your mentor...
        </div>
      </div>
    );
  }

  // Show error state if prompt failed to load
  if (chatState.promptError) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-red-500 text-sm max-w-md text-center">
          {chatState.promptError}
        </div>
      </div>
    );
  }

  // Show error if we don't have a valid config yet
  if (!realtimeConfig || !voicePrompt) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-muted-foreground text-sm">
          Setting up your mentor...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio element for realtime audio */}
      <audio ref={audioRef} autoPlay />

      <VoiceChat
        realtimeConfig={realtimeConfig}
        avatarUrl={AVATAR_URL}
        onStop={handleVoiceChatStop}
        enableTextEntry={false} // Mentors typically don't need text input
        onConversationStart={handleConversationStart}
        onConversationEnd={handleConversationEnd}
      />

      {/* Agent Actions Progress UI */}
      <AgentActions />
    </div>
  );
}