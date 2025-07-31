"use client";

import { Module } from "@/data/modules";
import { User } from "@/data/user";
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { RolePlayer } from "@/types/chat-types";
import {
  createHistoryEntryAction,
  deleteHistoryEntryAction,
} from "@/app/actions/history-actions";
import { useTranscriptSave } from "@/hooks/use-transcript-save";
import { EndChatDialog } from "@/components/end-chat-dialog";
import { SkillsDialog } from "@/components/skills-dialog";
import { TraitsDialog } from "@/components/traits-dialog";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { useRouter } from "next/navigation";
import { CountdownBar } from "@/components/countdown-bar";
import { ChatTextEntry } from "@/components/chat-text-entry";
import { useOpenAIAgentsWithTranscript } from "@/hooks/use-openai-agents-with-transcript";
import { useTranscript } from "@/contexts/transcript";
import { toast } from "@/hooks/use-toast";
import { TranscriptProvider } from "@/contexts/transcript";
import { logger } from "@/lib/logger";
import { SimulationCustomizationProvider } from "@/contexts/simulation-customization-context";
import { updateTranscriptionUsageAction } from "@/app/actions/usage-actions";
import { getTrainingNoteAction } from "@/app/actions/training-notes-actions";
import { MODEL_NAMES } from "@/types/models";
import { useIsMobile } from "@/hooks/use-mobile";
import { SimulationContentTabs } from "@/components/simulation-content-tabs";
import { TranscriptEntry } from "@/types/chat-types";
import { SpeakingBubble } from "./speaking-bubble";
import { createRolePlayingAgent } from "@/prompts/role-playing-agent";
import { useSimulationCustomization } from "@/contexts/simulation-customization-context";
import { Skills, Traits } from "@/types/character-attributes";

type OpenAIChatContentProps = {
  module: Module;
  currentUser: User;
};

type LayoutProps = {
  module: Module;
  currentUser: User;
  chatState: {
    isConversationActive: boolean;
    isTimeout: boolean;
    showEndDialog: boolean;
    showNoCreditsDialog: boolean;
  };
  setChatState: React.Dispatch<
    React.SetStateAction<{
      isConversationActive: boolean;
      isTimeout: boolean;
      showEndDialog: boolean;
      showNoCreditsDialog: boolean;
    }>
  >;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  sessionDurationMinutes: number;
  HARD_TIMEOUT_MINUTES: number;
  handleCountdownComplete: () => void;
  handleDurationChange: (newDuration: number) => void;
  rolePlayers: RolePlayer[];
  handleToggleConversation: () => void;
  isMuted: boolean;
  unmuteMicrophone: () => void;
  muteMicrophone: () => void;
  handleSendMessage: (message: string) => void;
  handleEndWithoutSaving: () => Promise<void>;
  handleEndAndSave: () => Promise<void>;
  transcriptEntries: TranscriptEntry[];
  isAgentSpeaking: boolean;
  showAvatar: boolean;
  notes: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  effectiveSkills: Skills;
  effectiveTraits: Traits;
  onSkillsChange: (skills: Skills) => void;
  onTraitsChange: (traits: Traits) => void;
};

export default function OpenAIChat({
  module,
  currentUser,
}: OpenAIChatContentProps) {
  return (
    <TranscriptProvider>
      <SimulationCustomizationProvider>
        <OpenAIChatContent module={module} currentUser={currentUser} />
      </SimulationCustomizationProvider>
    </TranscriptProvider>
  );
}

function DesktopLayout({
  module,
  chatState,
  setChatState,
  audioRef,
  sessionDurationMinutes,
  HARD_TIMEOUT_MINUTES,
  handleCountdownComplete,
  handleDurationChange,
  rolePlayers,
  handleToggleConversation,
  isMuted,
  unmuteMicrophone,
  muteMicrophone,
  handleSendMessage,
  handleEndWithoutSaving,
  handleEndAndSave,
  transcriptEntries,
  isAgentSpeaking,
  showAvatar,
  notes,
  isConnected,
  isConnecting,
  effectiveSkills,
  effectiveTraits,
  onSkillsChange,
  onTraitsChange,
}: LayoutProps) {
  return (
    <div className="grid lg:grid-cols-[max-content,1fr] grid-cols-1 gap-4 lg:gap-4 h-[calc(100vh-4rem)] grid-rows-[auto,1fr] lg:grid-rows-1 p-4">
      <div className="mx-auto lg:mx-0">
        <Card className="w-[448px] max-w-full">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CountdownBar
                initialMinutes={sessionDurationMinutes}
                maxDurationMinutes={HARD_TIMEOUT_MINUTES}
                onCountdownComplete={handleCountdownComplete}
                onDurationChange={handleDurationChange}
                isActive={chatState.isConversationActive || isConnected}
              />
              <div className="flex items-center gap-2">
                <SkillsDialog
                  disabled={chatState.isConversationActive || isConnected}
                  mode="simulation"
                  skills={effectiveSkills}
                  onSave={onSkillsChange}
                />
                <TraitsDialog
                  disabled={chatState.isConversationActive || isConnected}
                  mode="simulation"
                  traits={effectiveTraits}
                  onSave={onTraitsChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <SpeakingBubble
                audioRef={audioRef}
                isPlaying={isAgentSpeaking}
                avatarUrl={rolePlayers[0]?.avatarUrl}
                showAvatar={showAvatar}
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={
                  chatState.isConversationActive || isConnected
                    ? "danger"
                    : "brand"
                }
                onClick={handleToggleConversation}
                className="w-48"
                disabled={isConnecting}
              >
                {chatState.isConversationActive || isConnected ? (
                  <span className="flex items-center">
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Conversation
                  </span>
                ) : isConnecting ? (
                  <span className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Start Conversation
                  </span>
                )}
              </Button>

              <Button
                size="lg"
                variant="ghost-brand"
                onClick={isMuted ? unmuteMicrophone : muteMicrophone}
                className="w-48"
              >
                {isMuted ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Unmute Mic
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Mute Mic
                  </>
                )}
              </Button>
            </div>

            <ChatTextEntry
              onSendMessage={handleSendMessage}
              isEnabled={chatState.isConversationActive || isConnected}
            />
          </CardContent>
          <EndChatDialog
            isOpen={chatState.showEndDialog}
            onOpenChange={(open) =>
              setChatState((prev) => ({ ...prev, showEndDialog: open }))
            }
            onEndChat={handleEndWithoutSaving}
            onEndAndSave={handleEndAndSave}
            isTimeout={chatState.isTimeout}
          />
        </Card>
      </div>

      <SimulationContentTabs
        module={module}
        notes={notes}
        transcriptEntries={transcriptEntries}
      />
      <NoCreditsDialog
        isOpen={chatState.showNoCreditsDialog}
        onOpenChange={(open) =>
          setChatState((prev) => ({ ...prev, showNoCreditsDialog: open }))
        }
        title="No Credits Available"
        description="You don't have enough credits to start a conversation. Purchase additional credits to continue using AI features."
      />
    </div>
  );
}

function MobileLayout({
  module,
  chatState,
  setChatState,
  audioRef,
  sessionDurationMinutes,
  HARD_TIMEOUT_MINUTES,
  handleCountdownComplete,
  handleDurationChange,
  rolePlayers,
  handleToggleConversation,
  isMuted,
  unmuteMicrophone,
  muteMicrophone,
  handleEndWithoutSaving,
  handleEndAndSave,
  transcriptEntries,
  isAgentSpeaking,
  showAvatar,
  notes,
  isConnected,
  isConnecting,
  effectiveSkills,
  effectiveTraits,
  onSkillsChange,
  onTraitsChange,
}: LayoutProps) {
  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-grow flex flex-col items-center space-y-4">
        <div className="flex items-center justify-between w-full">
          <CountdownBar
            initialMinutes={sessionDurationMinutes}
            maxDurationMinutes={HARD_TIMEOUT_MINUTES}
            onCountdownComplete={handleCountdownComplete}
            onDurationChange={handleDurationChange}
            isActive={chatState.isConversationActive || isConnected}
          />
          <div className="flex items-center gap-2">
            <SkillsDialog
              disabled={chatState.isConversationActive || isConnected}
              mode="simulation"
              skills={effectiveSkills}
              onSave={onSkillsChange}
            />
            <TraitsDialog
              disabled={chatState.isConversationActive || isConnected}
              mode="simulation"
              traits={effectiveTraits}
              onSave={onTraitsChange}
            />
          </div>
        </div>
        <div className="flex items-center justify-center">
          <SpeakingBubble
            audioRef={audioRef}
            isPlaying={isAgentSpeaking}
            avatarUrl={rolePlayers[0]?.avatarUrl}
            showAvatar={showAvatar}
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <Button
            size="lg"
            variant={
              chatState.isConversationActive || isConnected ? "danger" : "brand"
            }
            onClick={handleToggleConversation}
            className="w-full max-w-xs"
            disabled={isConnecting}
          >
            {chatState.isConversationActive || isConnected ? (
              <span className="flex items-center">
                <PhoneOff className="mr-2 h-4 w-4" />
                End Conversation
              </span>
            ) : isConnecting ? (
              <span className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Start Conversation
              </span>
            )}
          </Button>
          <Button
            size="lg"
            variant="ghost-brand"
            onClick={isMuted ? unmuteMicrophone : muteMicrophone}
            className="w-full max-w-xs"
          >
            {isMuted ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Unmute Mic
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Mute Mic
              </>
            )}
          </Button>
        </div>
      </div>
      <SimulationContentTabs
        module={module}
        notes={notes}
        transcriptEntries={transcriptEntries}
      />
      <EndChatDialog
        isOpen={chatState.showEndDialog}
        onOpenChange={(open) =>
          setChatState((prev) => ({ ...prev, showEndDialog: open }))
        }
        onEndChat={handleEndWithoutSaving}
        onEndAndSave={handleEndAndSave}
        isTimeout={chatState.isTimeout}
      />
      <NoCreditsDialog
        isOpen={chatState.showNoCreditsDialog}
        onOpenChange={(open) =>
          setChatState((prev) => ({ ...prev, showNoCreditsDialog: open }))
        }
        title="No Credits Available"
        description="You don't have enough credits to start a conversation. Purchase additional credits to continue using AI features."
      />
    </div>
  );
}

function OpenAIChatContent({ module, currentUser }: OpenAIChatContentProps) {
  const [chatState, setChatState] = useState({
    isConversationActive: false,
    isTimeout: false,
    showEndDialog: false,
    showNoCreditsDialog: false,
  });

  const {
    getEffectiveSkills,
    getEffectiveTraits,
    setSkillsOverride,
    setTraitsOverride,
  } = useSimulationCustomization();
  const [historyEntryId, setHistoryEntryId] = useState<number>();
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const { transcriptEntries, clearTranscript } = useTranscript();
  const { saveAndComplete } = useTranscriptSave({
    historyEntryId,
    transcriptBuffer: transcriptEntries,
    saveInterval: 20000,
  });
  const router = useRouter();
  const HARD_TIMEOUT_MINUTES = process.env.NEXT_PUBLIC_CHAT_HARD_TIMEOUT_MINUTES
    ? parseInt(process.env.NEXT_PUBLIC_CHAT_HARD_TIMEOUT_MINUTES)
    : 2;

  // Add AbortController to prevent async operations after unmount
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const isMountedRef = useRef(true);

  // State for adjustable session duration
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(
    Math.floor(HARD_TIMEOUT_MINUTES / 2) || 1 // Default to half, min 1
  );

  // Get current character skills and traits for the dialogs
  const currentCharacter = module.modulePrompt.characters[0];
  const currentSkills = currentCharacter?.skills;
  const currentTraits = currentCharacter?.traits;

  const effectiveSkills = getEffectiveSkills(currentSkills);
  const effectiveTraits = getEffectiveTraits(currentTraits);

  // Create RealtimeAgent from module prompt
  const agent = useMemo(() => {
    const createdAgent = createRolePlayingAgent(
      module.modulePrompt,
      effectiveSkills,
      effectiveTraits
    );
    logger.info("🤖 Created agent:", {
      name: createdAgent.name,
      voice: createdAgent.voice,
      hasInstructions: !!createdAgent.instructions,
      instructionsLength: createdAgent.instructions?.length,
      hasSkillsOverride: !!effectiveSkills,
      hasTraitsOverride: !!effectiveTraits,
    });
    return createdAgent;
  }, [module.modulePrompt, effectiveSkills, effectiveTraits]);

  const agentName = useMemo(
    () => module.modulePrompt.characters[0]?.name || "agent",
    [module.modulePrompt.characters]
  );

  // Component unmount cleanup
  useEffect(() => {
    const abortController = abortControllerRef.current;
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, []);

  // Fetch training notes for the module
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const trainingNote = await getTrainingNoteAction(module.id);
        setNotes(trainingNote?.notes || null);
      } catch (error) {
        logger.error(`Failed to fetch training notes: ${error}`);
      }
    };
    fetchNotes();
  }, [module.id]);

  // Avatar should appear only after connection (historyEntryId) is established
  const showAvatar = Boolean(historyEntryId);

  const { muteMicrophone, unmuteMicrophone, isMuted } = useMicrophone();

  const {
    connect,
    disconnect,
    sendTextMessage,
    transcriptionModel,
    isConnected,
    isConnecting,
    error: agentError,
    audioRef: agentAudioRef,
    isSpeaking: agentSpeaking,
  } = useOpenAIAgentsWithTranscript(agent, currentUser.displayName, agentName);

  // Use the speaking state from the Voice Agents hook
  useEffect(() => {
    setIsAgentSpeaking(agentSpeaking);
  }, [agentSpeaking]);

  // Synchronize connection state between hook and component
  useEffect(() => {
    if (!isConnected && !isConnecting && chatState.isConversationActive) {
      // Hook disconnected but component thinks conversation is still active
      logger.info("[State Sync] Hook disconnected, updating component state");
      setChatState((prev) => ({ ...prev, isConversationActive: false }));
    }
  }, [isConnected, isConnecting, chatState.isConversationActive]);

  // Callback to update duration state from CountdownBar
  const handleDurationChange = useCallback((newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  }, []);

  const logUsageMetrics = useCallback(async () => {
    logger.info("[logUsageMetrics] Attempting to log usage metrics."); // Debug log
    logger.info(
      `[logUsageMetrics] Current sessionStartTime: ${sessionStartTime}`
    ); // Debug log
    logger.info(
      `[logUsageMetrics] Current transcriptEntries length: ${transcriptEntries.length}`
    ); // Debug log

    if (sessionStartTime === null) {
      logger.warn(
        "[logUsageMetrics] Session start time is null. Skipping metrics logging."
      );
      return;
    }

    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - sessionStartTime) / 1000;

    let totalUserChars = 0;
    let totalAgentChars = 0;

    transcriptEntries.forEach((entry) => {
      if (entry.role === "user" && entry.text) {
        totalUserChars += entry.text.length;
      } else if (entry.role === "agent" && entry.text) {
        totalAgentChars += entry.text.length;
      }
    });

    // Usage tracking is now handled in the Voice Agents hook

    // Track transcription usage in database - ALWAYS track, regardless of mount status
    if (totalUserChars > 0 || totalAgentChars > 0) {
      try {
        await updateTranscriptionUsageAction({
          modelName: transcriptionModel || MODEL_NAMES.OPENAI_TRANSCRIBE, // Use actual model or fallback
          totalSessionLength: elapsedTimeInSeconds,
          userChars: totalUserChars,
          agentChars: totalAgentChars,
        });

        // Only log success if component is still mounted
        if (isMountedRef.current) {
          logger.info("Transcription usage tracked successfully");
        } else {
          logger.info(
            "Transcription usage tracked successfully (component unmounted)"
          );
        }
      } catch (error) {
        // Always log errors, regardless of mount status
        logger.error(`Failed to track transcription usage: ${error}`);
        // Don't fail the request if usage tracking fails
      }
    }

    setSessionStartTime(null); // Reset start time after logging
  }, [
    sessionStartTime,
    transcriptEntries,
    setSessionStartTime,
    transcriptionModel,
  ]);

  const handleToggleConversation = useCallback(async () => {
    logger.debug("🎯 [handleToggleConversation] Button clicked");
    logger.debug("🎯 [handleToggleConversation] Current state:", {
      isConversationActive: chatState.isConversationActive,
      isConnected,
      isConnecting,
    });

    if (chatState.isConversationActive || isConnected) {
      logger.debug("🎯 [handleToggleConversation] Ending conversation");
      setChatState((prev) => ({ ...prev, showEndDialog: true }));
    } else {
      // Don't allow multiple connection attempts
      if (isConnecting) {
        logger.warn("Connection already in progress, ignoring toggle");
        return;
      }

      setSessionStartTime(Date.now());

      logger.debug(
        "🎯 [handleToggleConversation] Starting connection (Voice Agents SDK handles microphone internally)"
      );
      try {
        await connect();
        logger.debug("🎯 [handleToggleConversation] Connection successful");

        const newHistoryEntryId = await createHistoryEntryAction(module.id);
        setHistoryEntryId(newHistoryEntryId);
        logger.info(
          "[handleToggleConversation] Session fully established and history created."
        );
        // Only set conversation active after successful connection
        setChatState((prev) => ({ ...prev, isConversationActive: true }));
      } catch (error) {
        // Revert UI on failure
        logger.error(
          `🎯 [handleToggleConversation] Connection failed: ${error}`
        );
        setSessionStartTime(null);

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Handle specific errors like no credits
        setChatState((prev) => ({
          ...prev,
          isConversationActive: false,
          showNoCreditsDialog: errorMessage.includes("No credits available"),
        }));

        if (!errorMessage.includes("No credits available")) {
          toast({
            title: "Failed to Start Conversation",
            description: errorMessage || "Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  }, [
    chatState.isConversationActive,
    isConnected,
    isConnecting,
    connect,
    module.id,
  ]);

  // Handle agent errors
  useEffect(() => {
    if (agentError) {
      if (agentError.includes("No credits available")) {
        setChatState((prev) => ({
          ...prev,
          isConversationActive: false,
          showNoCreditsDialog: true,
        }));
      } else {
        toast({
          title: "Agent Error",
          description: agentError,
          variant: "destructive",
        });
      }
    }
  }, [agentError]);

  const handleCountdownComplete = useCallback(async () => {
    logger.info(
      "[handleCountdownComplete] Countdown completed. Calling logUsageMetrics."
    ); // Debug log
    await logUsageMetrics();
    disconnect();
    setChatState((prev) => ({
      ...prev,
      isConversationActive: false,
      isTimeout: true,
      showEndDialog: true,
    }));
  }, [disconnect, logUsageMetrics]);

  const handleEndWithoutSaving = useCallback(async () => {
    logger.info(
      "[handleEndWithoutSaving] Ending without saving. Calling logUsageMetrics."
    ); // Debug log
    await logUsageMetrics();
    disconnect();
    if (historyEntryId) {
      await deleteHistoryEntryAction(historyEntryId);
      setHistoryEntryId(undefined);
    }
    clearTranscript();
    setChatState((prev) => ({
      ...prev,
      isConversationActive: false,
      isTimeout: false,
      showEndDialog: false,
    }));
  }, [disconnect, historyEntryId, clearTranscript, logUsageMetrics]);

  const handleEndAndSave = useCallback(async () => {
    try {
      logger.info(
        "[handleEndAndSave] Ending and saving. Calling logUsageMetrics."
      ); // Debug log
      await logUsageMetrics();
      disconnect();
      await saveAndComplete();
      setChatState((prev) => ({
        ...prev,
        isConversationActive: false,
        isTimeout: false,
        showEndDialog: false,
      }));
      if (historyEntryId) {
        router.push(`/assessments/${historyEntryId}`);
      }
    } catch (error) {
      logger.error(`Failed to save and complete: ${error}`);
      toast({
        title: "Failed to save and complete",
        description: "Please try again.",
      });
      setChatState((prev) => ({
        ...prev,
        showEndDialog: false,
      }));
      if (historyEntryId) {
        router.push(`/assessments/${historyEntryId}`);
      }
    }
  }, [disconnect, saveAndComplete, historyEntryId, router, logUsageMetrics]);

  const handleSendMessage = useCallback(
    (message: string) => {
      sendTextMessage(message);
    },
    [sendTextMessage]
  );

  const handleSkillsChange = useCallback(
    (skills: Skills) => {
      setSkillsOverride(skills);
    },
    [setSkillsOverride]
  );

  const handleTraitsChange = useCallback(
    (traits: Traits) => {
      setTraitsOverride(traits);
    },
    [setTraitsOverride]
  );

  const rolePlayers: RolePlayer[] = useMemo(
    () =>
      module.modulePrompt.characters.map((character) => ({
        name: character.name,
        agentName: "agent",
        avatarUrl: character.avatarUrl || undefined,
      })),
    [module.modulePrompt.characters]
  );

  const isMobile = useIsMobile();

  const layoutProps: LayoutProps = {
    module,
    currentUser,
    chatState,
    setChatState,
    audioRef: agentAudioRef,
    sessionDurationMinutes,
    HARD_TIMEOUT_MINUTES,
    handleCountdownComplete,
    handleDurationChange,
    rolePlayers,
    handleToggleConversation,
    isMuted,
    unmuteMicrophone,
    muteMicrophone,
    handleSendMessage,
    handleEndWithoutSaving,
    handleEndAndSave,
    transcriptEntries,
    isAgentSpeaking,
    showAvatar,
    notes,
    isConnected,
    isConnecting,
    effectiveSkills,
    effectiveTraits,
    onSkillsChange: handleSkillsChange,
    onTraitsChange: handleTraitsChange,
  };

  return (
    <>
      <audio ref={agentAudioRef} className="hidden" crossOrigin="anonymous" />
      {isMobile ? (
        <MobileLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}
    </>
  );
}
