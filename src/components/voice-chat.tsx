"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { SpeakingBubble } from "@/components/speaking-bubble";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { RealtimeConfig, ConnectionState } from "@/types/realtime";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { useUsage } from "@/contexts/usage-context";


export interface VoiceChatProps {
  realtimeConfig: RealtimeConfig;
  avatarUrl?: string;
  onStop: (actualStopFn: () => Promise<void>) => void;
  countdownFrom?: number; // minutes to countdown from
  onConversationStart?: () => Promise<void>; // Called when conversation starts
  onConversationEnd?: () => Promise<void>; // Called when conversation ends
}


export function VoiceChat({
  realtimeConfig,
  avatarUrl,
  onStop,
  countdownFrom,
  onConversationStart,
  onConversationEnd,
}: VoiceChatProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [conversationState, setConversationState] = useState<ConnectionState>('stopped');
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [isAudioAvailable, setIsAudioAvailable] = useState(false);

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
      setIsAudioAvailable(false);
    }
  }, [connectionState]);

  // Track audio availability separately from connection state
  useEffect(() => {
    const audioElement = effectiveAudioRef?.current;
    if (!audioElement) return;

    const handleLoadedData = () => setIsAudioAvailable(true);
    const handleEmptied = () => setIsAudioAvailable(false);
    const handleError = () => setIsAudioAvailable(false);

    audioElement.addEventListener('loadeddata', handleLoadedData);
    audioElement.addEventListener('emptied', handleEmptied);
    audioElement.addEventListener('error', handleError);

    // Check current state
    if (audioElement.srcObject) {
      setIsAudioAvailable(true);
    }

    return () => {
      audioElement.removeEventListener('loadeddata', handleLoadedData);
      audioElement.removeEventListener('emptied', handleEmptied);
      audioElement.removeEventListener('error', handleError);
    };
  }, [effectiveAudioRef]);

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

  // Timer management will be set up after function declarations

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
      // Let parent handle dialog, pass the actual stop function
      onStop(handleStopConversation);
    }
  }, [conversationState, handleStartConversation, handleStopConversation, onStop]);

  // Timer management for countdown
  useEffect(() => {
    if (!countdownFrom || conversationState !== 'connected') return;

    const timeoutDuration = countdownFrom * 60 * 1000; // convert minutes to milliseconds
    const timer = setTimeout(() => {
      // Call onStop directly - parent can handle timeout behavior
      onStop(handleStopConversation);
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [countdownFrom, conversationState, onStop, handleStopConversation]);



  // Determine if conversation is active
  const isConversationActive = conversationState !== 'stopped';
  const isConnecting = conversationState === 'connecting';
  // Agent is speaking when connected and audio is available
  const isAgentSpeaking = isConversationActive && showAvatar && isAudioAvailable;

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



      {/* No Credits Dialog */}
      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
      />
    </div>
  );
}