"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { SpeakingBubble } from "@/components/speaking-bubble";
import { ChatTextEntry } from "@/components/chat-text-entry";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { RealtimeConfig, MessageItem } from "@/types/realtime";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { useUsage } from "@/contexts/usage-context";


export interface VoiceChatProps {
  realtimeConfig: RealtimeConfig;
  avatarUrl?: string;
  onStop: () => void;
  countdownFrom?: number; // minutes to countdown from
  enableTextEntry?: boolean;
  onConversationStart?: () => Promise<void>; // Called when conversation starts
  onConversationEnd?: () => Promise<void>; // Called when conversation ends
}

type VoiceChatState = 'stopped' | 'starting' | 'connected' | 'started';

export function VoiceChat({
  realtimeConfig,
  avatarUrl,
  onStop,
  countdownFrom,
  enableTextEntry = false,
  onConversationStart,
  onConversationEnd,
}: VoiceChatProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [conversationState, setConversationState] = useState<VoiceChatState>('stopped');
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);

  // Use the provided audioRef in the config, but fall back to our local ref
  const effectiveAudioRef = realtimeConfig.audioRef || audioRef;

  // Microphone management
  const {
    isMuted,
    muteMicrophone,
    unmuteMicrophone,
    startMicrophone,
    stopMicrophone,
    checkMicrophoneAvailability,
  } = useMicrophone();

  // Realtime connection
  const {
    connect,
    disconnect,
    sendMessage,
    usage,
    transcriptionUsage,
    transcriptionModel,
    connectionState,
    error,
    refreshUsageData,
  } = useRealtime(realtimeConfig);

  // Usage tracking
  const { startSession, logUsageMetrics } = useUsage();

  // Sync our local state with the realtime connection state
  useEffect(() => {
    setConversationState(connectionState);
    
    // Show avatar when connected
    if (connectionState === 'connected') {
      setShowAvatar(true);
    } else if (connectionState === 'stopped') {
      setShowAvatar(false);
    }
  }, [connectionState]);

  // Handle errors from the realtime provider
  useEffect(() => {
    if (error) {
      logger.error("Realtime error:", error);
      
      if (error.type === 'credits') {
        setShowNoCreditsDialog(true);
      } else {
        toast({
          title: "Connection Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, [error]);

  // Timer management for countdown
  useEffect(() => {
    if (!countdownFrom || conversationState !== 'started') return;

    const timeoutDuration = countdownFrom * 60 * 1000; // convert minutes to milliseconds
    const timer = setTimeout(() => {
      // Call onStop directly - parent can handle timeout behavior
      onStop();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [countdownFrom, conversationState, onStop]);

  const handleStartConversation = useCallback(async () => {
    try {
      // Start usage session
      startSession();

      // Call the conversation start callback first
      if (onConversationStart) {
        await onConversationStart();
      }

      // Check microphone availability first
      const { isAvailable, error: micError } = await checkMicrophoneAvailability();
      if (!isAvailable) {
        toast({
          title: "Microphone Error",
          description: micError?.message || "Microphone not available",
          variant: "destructive",
        });
        return;
      }

      // Start microphone
      const stream = await startMicrophone();
      if (!stream) {
        toast({
          title: "Microphone Error", 
          description: "Failed to start microphone",
          variant: "destructive",
        });
        return;
      }

      // Connect to realtime service
      await connect(stream);
      
    } catch (err) {
      logger.error("Failed to start conversation:", err);
      // Error will be handled by the error effect above
    }
  }, [startSession, onConversationStart, checkMicrophoneAvailability, startMicrophone, connect]);

  const handleStopConversation = useCallback(async () => {
    try {
      // Refresh and get latest usage data from provider
      const latestUsageData = refreshUsageData();
      
      await disconnect();
      stopMicrophone();
      
      // Log usage metrics with debug info
      logger.info("VoiceChat: Logging usage metrics", { 
        latestUsage: latestUsageData.usage,
        latestTranscriptionUsage: latestUsageData.transcriptionUsage, 
        latestTranscriptionModel: latestUsageData.transcriptionModel,
        hookUsage: usage,
        hookTranscriptionUsage: transcriptionUsage,
        hookTranscriptionModel: transcriptionModel
      });
      await logUsageMetrics(latestUsageData.usage, latestUsageData.transcriptionUsage, latestUsageData.transcriptionModel);
      
      // Call the conversation end callback
      if (onConversationEnd) {
        await onConversationEnd();
      }
    } catch (err) {
      logger.error("Failed to stop conversation:", err);
    }
  }, [disconnect, stopMicrophone, refreshUsageData, usage, transcriptionUsage, transcriptionModel, logUsageMetrics, onConversationEnd]);

  const handleToggleConversation = useCallback(async () => {
    if (conversationState === 'stopped') {
      handleStartConversation();
    } else {
      // First handle the conversation stop (usage tracking, etc.)
      await handleStopConversation();
      // Then let parent handle any dialog logic
      onStop();
    }
  }, [conversationState, handleStartConversation, handleStopConversation, onStop]);

  const handleSendTextMessage = useCallback(async (text: string) => {
    if (conversationState !== 'started') return;
    
    const message: MessageItem = {
      type: 'user',
      content: text,
      timestamp: Date.now(),
    };
    
    try {
      await sendMessage(message);
    } catch (err) {
      logger.error("Failed to send message:", err);
      toast({
        title: "Message Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [conversationState, sendMessage]);


  // Determine if conversation is active
  const isConversationActive = conversationState !== 'stopped';
  const isConnecting = conversationState === 'starting';
  const isAgentSpeaking = conversationState === 'started' && showAvatar;

  return (
    <div className="space-y-6">
      {/* Audio element for realtime audio */}
      <audio ref={effectiveAudioRef} autoPlay />

      {/* Speaking Bubble */}
      <div className="flex items-center justify-center">
        <SpeakingBubble
          audioRef={effectiveAudioRef}
          isPlaying={isAgentSpeaking}
          avatarUrl={avatarUrl}
          showAvatar={showAvatar}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {/* Start/Stop Conversation Button */}
        <Button
          onClick={handleToggleConversation}
          variant={isConversationActive ? "destructive" : "brand"}
          size="lg"
          disabled={isConnecting}
          className="flex items-center space-x-2"
        >
          {isConversationActive ? (
            <>
              <PhoneOff className="h-5 w-5" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              <span>{isConnecting ? "Connecting..." : "Start"}</span>
            </>
          )}
        </Button>

        {/* Mute/Unmute Button */}
        {isConversationActive && (
          <Button
            onClick={isMuted ? unmuteMicrophone : muteMicrophone}
            variant="outline"
            size="lg"
            className="flex items-center space-x-2"
          >
            {isMuted ? (
              <>
                <MicOff className="h-5 w-5" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                <span>Mute</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Text Entry (Optional) */}
      {enableTextEntry && isConversationActive && (
        <div className="max-w-md mx-auto">
          <ChatTextEntry 
            onSendMessage={handleSendTextMessage}
            isEnabled={conversationState === 'started'}
          />
        </div>
      )}


      {/* No Credits Dialog */}
      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
      />
    </div>
  );
}