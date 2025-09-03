"use client";

import { Module } from "@/data/modules";
import { User } from "@/data/user";
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RolePlayer } from "@/types/chat-types";
import {
  createHistoryEntryAction,
  deleteHistoryEntryAction,
} from "@/app/actions/history-actions";
import { useTranscriptSave } from "@/hooks/use-transcript-save";
import { SkillsDialog } from "@/components/skills-dialog";
import { TraitsDialog } from "@/components/traits-dialog";
import { useRouter } from "next/navigation";
import { CountdownBar } from "@/components/countdown-bar";
import { useTranscript } from "@/contexts/transcript";
import { toast } from "@/hooks/use-toast";
import { TranscriptProvider } from "@/contexts/transcript";
import { logger } from "@/lib/logger";
import { SimulationCustomizationProvider } from "@/contexts/simulation-customization-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { SimulationContentTabs } from "@/components/simulation-content-tabs";
import { TranscriptEntry } from "@/types/chat-types";
import { createRolePlayingVoicePrompt } from "@/prompts/role-playing-voice-prompt";
import { useSimulationCustomization } from "@/contexts/simulation-customization-context";
import { Skills, Traits } from "@/types/character-attributes";
import { VoiceChat } from "@/components/voice-chat";
import { StopConversationDialog } from "@/components/stop-conversation-dialog";
import { RealtimeConfig } from "@/types/realtime";
import { UsageProvider } from "@/contexts/usage-context";
import { AI_MODELS } from "@/types/models";

type RolePlaySimulationProps = {
  module: Module;
  currentUser: User;
  notes: string | null;
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
  handleEndWithoutSaving: () => Promise<void>;
  handleEndAndSave: () => Promise<void>;
  transcriptEntries: TranscriptEntry[];
  notes: string | null;
  effectiveSkills: Skills;
  effectiveTraits: Traits;
  onSkillsChange: (skills: Skills) => void;
  onTraitsChange: (traits: Traits) => void;
  realtimeConfig: RealtimeConfig;
  handleVoiceChatStop: () => void;
  handleConversationStart: () => Promise<void>;
  handleConversationEnd: () => Promise<void>;
};

export default function RolePlaySimulation({
  module,
  currentUser,
  notes,
}: RolePlaySimulationProps) {
  return (
    <TranscriptProvider>
      <SimulationCustomizationProvider>
        <UsageProvider>
          <RolePlaySimulationContent
            module={module}
            currentUser={currentUser}
            notes={notes}
          />
        </UsageProvider>
      </SimulationCustomizationProvider>
    </TranscriptProvider>
  );
}

function RolePlaySimulationContent({
  module,
  currentUser,
  notes,
}: RolePlaySimulationProps) {
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
  const { transcriptEntries, clearTranscript } = useTranscript();
  
  const { saveAndComplete } = useTranscriptSave({
    historyEntryId,
    transcriptBuffer: transcriptEntries,
    saveInterval: 20000,
  });

  const router = useRouter();
  const isMobile = useIsMobile();

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

  // Create voice prompt from module
  const voicePrompt = useMemo(() => {
    return createRolePlayingVoicePrompt(
      module.modulePrompt,
      effectiveSkills,
      effectiveTraits
    );
  }, [module.modulePrompt, effectiveSkills, effectiveTraits]);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Determine provider based on module AI model
  const provider = useMemo(() => {
    switch (module.modulePrompt.aiModel) {
      case AI_MODELS.OPENAI:
        return 'openai' as const;
      // Future providers can be added here
      // case AI_MODELS.GEMINI:
      //   return 'gemini' as const;
      default:
        // Default to OpenAI for now
        return 'openai' as const;
    }
  }, [module.modulePrompt.aiModel]);

  // Create realtime config
  const realtimeConfig: RealtimeConfig = useMemo(() => ({
    provider,
    voice: voicePrompt,
    audioRef,
    userName: currentUser.email?.split('@')[0] || currentUser.id.toString(),
    enableTranscription: true,
    enableUsageTracking: true,
  }), [provider, voicePrompt, currentUser]);

  const rolePlayers: RolePlayer[] = useMemo(() => {
    return module.modulePrompt.characters.map((char) => ({
      name: char.name,
      agentName: char.name,
      avatarUrl: char.avatarUrl || undefined,
    }));
  }, [module.modulePrompt.characters]);

  // Component unmount cleanup
  useEffect(() => {
    const abortController = abortControllerRef.current;
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      isTimeout: true,
      showEndDialog: true,
    }));
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    setSessionDurationMinutes(newDuration);
  }, []);

  const handleEndWithoutSaving = useCallback(async () => {
    try {
      if (historyEntryId) {
        await deleteHistoryEntryAction(historyEntryId);
      }
      clearTranscript();
      setChatState({
        isConversationActive: false,
        isTimeout: false,
        showEndDialog: false,
        showNoCreditsDialog: false,
      });
      setHistoryEntryId(undefined);
      router.push("/");
    } catch (error) {
      logger.error("Failed to end without saving:", error);
      toast({
        title: "Error",
        description: "Failed to end conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [historyEntryId, clearTranscript, router]);

  const handleEndAndSave = useCallback(async () => {
    try {
      if (historyEntryId) {
        await saveAndComplete();
        router.push(`/assessments/${historyEntryId}`);
      }
      clearTranscript();
      setChatState({
        isConversationActive: false,
        isTimeout: false,
        showEndDialog: false,
        showNoCreditsDialog: false,
      });
      setHistoryEntryId(undefined);
    } catch (error) {
      logger.error("Failed to end and save:", error);
      toast({
        title: "Error",
        description: "Failed to save conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [historyEntryId, saveAndComplete, clearTranscript, router]);

  // Handle VoiceChat lifecycle events
  const handleConversationStart = useCallback(async () => {
    try {
      // Create history entry when conversation starts
      const entry = await createHistoryEntryAction(module.id);
      setHistoryEntryId(entry);
      setChatState((prev) => ({ ...prev, isConversationActive: true }));
      
      logger.info(`Started conversation with history entry ID: ${entry}`);
    } catch (error) {
      logger.error("Failed to start conversation:", error);
      
      // Check if it's a credit error
      if (error instanceof Error && error.message === "No credits available") {
        setChatState((prev) => ({ ...prev, showNoCreditsDialog: true }));
        throw error; // Re-throw to prevent connection
      }

      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent connection
    }
  }, [module.id]);

  const handleConversationEnd = useCallback(async () => {
    setChatState((prev) => ({ ...prev, isConversationActive: false }));
  }, []);

  const handleVoiceChatStop = useCallback(() => {
    setChatState((prev) => ({ ...prev, showEndDialog: true }));
  }, []);

  const onSkillsChange = useCallback((skills: Skills) => {
    setSkillsOverride(skills);
  }, [setSkillsOverride]);

  const onTraitsChange = useCallback((traits: Traits) => {
    setTraitsOverride(traits);
  }, [setTraitsOverride]);

  const layoutProps: LayoutProps = {
    module,
    currentUser,
    chatState,
    setChatState,
    audioRef,
    sessionDurationMinutes,
    HARD_TIMEOUT_MINUTES,
    handleCountdownComplete,
    handleDurationChange,
    rolePlayers,
    handleEndWithoutSaving,
    handleEndAndSave,
    transcriptEntries,
    notes,
    effectiveSkills,
    effectiveTraits,
    onSkillsChange,
    onTraitsChange,
    realtimeConfig,
    handleVoiceChatStop,
    handleConversationStart,
    handleConversationEnd,
  };

  return isMobile ? (
    <MobileLayout {...layoutProps} />
  ) : (
    <DesktopLayout {...layoutProps} />
  );
}

function DesktopLayout({
  module,
  chatState,
  sessionDurationMinutes,
  HARD_TIMEOUT_MINUTES,
  handleCountdownComplete,
  handleDurationChange,
  rolePlayers,
  handleEndAndSave,
  transcriptEntries,
  notes,
  effectiveSkills,
  effectiveTraits,
  onSkillsChange,
  onTraitsChange,
  realtimeConfig,
  handleVoiceChatStop,
  handleConversationStart,
  handleConversationEnd,
}: LayoutProps) {

  return (
    <div className="grid lg:grid-cols-[max-content_1fr] grid-cols-1 gap-4 lg:gap-4 h-[calc(100vh-4rem)] grid-rows-[auto_1fr] lg:grid-rows-1 p-4">
      <div className="mx-auto lg:mx-0">
        <Card className="w-[448px] max-w-full">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CountdownBar
                initialMinutes={sessionDurationMinutes}
                maxDurationMinutes={HARD_TIMEOUT_MINUTES}
                onCountdownComplete={handleCountdownComplete}
                onDurationChange={handleDurationChange}
                isActive={chatState.isConversationActive}
              />
              <div className="flex items-center gap-2">
                <SkillsDialog
                  disabled={chatState.isConversationActive}
                  mode="simulation"
                  skills={effectiveSkills}
                  onSave={onSkillsChange}
                />
                <TraitsDialog
                  disabled={chatState.isConversationActive}
                  mode="simulation"
                  traits={effectiveTraits}
                  onSave={onTraitsChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <VoiceChat
              realtimeConfig={realtimeConfig}
              avatarUrl={rolePlayers[0]?.avatarUrl}
              onStop={handleVoiceChatStop}
              onStopAndSave={handleEndAndSave}
              countdownFrom={sessionDurationMinutes}
              enableTextEntry={true}
              stopConversationDialog={StopConversationDialog}
              onConversationStart={handleConversationStart}
              onConversationEnd={handleConversationEnd}
            />
          </CardContent>
        </Card>
      </div>

      <SimulationContentTabs
        module={module}
        notes={notes}
        transcriptEntries={transcriptEntries}
      />
    </div>
  );
}

function MobileLayout({
  module,
  chatState,
  sessionDurationMinutes,
  HARD_TIMEOUT_MINUTES,
  handleCountdownComplete,
  handleDurationChange,
  rolePlayers,
  handleEndAndSave,
  transcriptEntries,
  notes,
  effectiveSkills,
  effectiveTraits,
  onSkillsChange,
  onTraitsChange,
  realtimeConfig,
  handleVoiceChatStop,
  handleConversationStart,
  handleConversationEnd,
}: LayoutProps) {

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <CountdownBar
            initialMinutes={sessionDurationMinutes}
            maxDurationMinutes={HARD_TIMEOUT_MINUTES}
            onCountdownComplete={handleCountdownComplete}
            onDurationChange={handleDurationChange}
            isActive={chatState.isConversationActive}
          />
          <div className="flex items-center gap-2">
            <SkillsDialog
              disabled={chatState.isConversationActive}
              mode="simulation"
              skills={effectiveSkills}
              onSave={onSkillsChange}
            />
            <TraitsDialog
              disabled={chatState.isConversationActive}
              mode="simulation"
              traits={effectiveTraits}
              onSave={onTraitsChange}
            />
          </div>
        </div>

        <VoiceChat
          realtimeConfig={realtimeConfig}
          avatarUrl={rolePlayers[0]?.avatarUrl}
          onStop={handleVoiceChatStop}
          onStopAndSave={handleEndAndSave}
          countdownFrom={sessionDurationMinutes}
          enableTextEntry={true}
          stopConversationDialog={StopConversationDialog}
          onConversationStart={handleConversationStart}
          onConversationEnd={handleConversationEnd}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <SimulationContentTabs
          module={module}
          notes={notes}
          transcriptEntries={transcriptEntries}
        />
      </div>
    </div>
  );
}