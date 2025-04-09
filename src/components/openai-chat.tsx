"use client";

import { Module } from "@/data/modules";
import { User } from "@/data/user";
import React, { useRef, useState, useCallback, useMemo } from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import AudioVisualiser from "@/components/audio-visualiser";
import { RolePlayersContainer } from "@/components/roleplayers-container";
import { RolePlayer } from "@/types/chat-types";
import { ModulePrompt } from "@/data/modules";
import { DEFAULT_VOICE } from "@/types/models";
import {
  createHistoryEntryAction,
  deleteHistoryEntryAction,
} from "@/app/actions/history-actions";
import { useTranscriptSave } from "@/hooks/use-transcript-save";
import { EndChatDialog } from "@/components/end-chat-dialog";
import { useRouter } from "next/navigation";
import { CountdownBar } from "@/components/countdown-bar";
import { ChatTextEntry } from "@/components/chat-text-entry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { TranscriptDisplay } from "@/components/transcript-display";
import { useOpenAIRealtime } from "@/hooks/use-openai-realtime";
import { useTranscript } from "@/contexts/transcript";
import { toast } from "@/hooks/use-toast";
import { TranscriptProvider } from "@/contexts/transcript";

type ChatProps = {
  module: Module;
  currentUser: User;
};

function createPrompt(modulePrompt: ModulePrompt) {
  const rolePlayInstruction =
    "You are a role-playing agent. You will be given a scenario. You should act as the character you are assigned to and play out the scenario as the best actor you can be. You should not deviate from the scenario.";

  const yourName =
    modulePrompt.characters.length > 0
      ? `Your name is ${modulePrompt.characters[0].name}.`
      : "";
  const yourCharacter =
    modulePrompt.characters.length > 0
      ? `Your character, traits are decribed as follows and you should act as them: ${modulePrompt.characters[0].prompt}.`
      : "";
  const prompt = `
  Instructions: 
  ${rolePlayInstruction}
  Information about you:
  ${yourName} 
  -------
  ${yourCharacter}
  Scenario:
  ${modulePrompt.scenario}
  `;

  return prompt;
}

export default function OpenAIChat({ module, currentUser }: ChatProps) {
  return (
    <TranscriptProvider>
      <OpenAIChatContent module={module} currentUser={currentUser} />
    </TranscriptProvider>
  );
}

function OpenAIChatContent({ module, currentUser }: ChatProps) {
  const audioRef = useRef<HTMLAudioElement>(
    null
  ) as React.RefObject<HTMLAudioElement>;
  const [chatState, setChatState] = useState({
    isConversationActive: false,
    isTimeout: false,
    showEndDialog: false,
  });
  const [historyEntryId, setHistoryEntryId] = useState<number>();
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

  const {
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
  } = useMicrophone();

  const { connect, disconnect, sendTextMessage } = useOpenAIRealtime({
    instructions: createPrompt(module.modulePrompt),
    voice: module.modulePrompt.characters[0]?.voice || DEFAULT_VOICE,
    audioRef,
    userName: currentUser.displayName,
    agentName: module.modulePrompt.characters[0]?.name || "agent",
  });

  const handleToggleConversation = useCallback(async () => {
    if (chatState.isConversationActive) {
      setChatState((prev) => ({ ...prev, showEndDialog: true }));
    } else {
      const micStream = await startMicrophone();
      try {
        await connect(micStream);
      } catch (error) {
        console.log("Failed to connect to OpenAI:", error);
        toast({
          title: `Failed to connect to OpenAI, make sure your API key is correct or you have enough credits`,
          description: "Please try again.",
        });
        return;
      }

      const newHistoryEntryId = await createHistoryEntryAction(module.id);
      setHistoryEntryId(newHistoryEntryId);

      setChatState((prev) => ({ ...prev, isConversationActive: true }));
    }
  }, [chatState.isConversationActive, startMicrophone, connect, module.id]);

  const handleCountdownComplete = useCallback(() => {
    disconnect();
    stopMicrophone();
    setChatState((prev) => ({
      ...prev,
      isConversationActive: false,
      isTimeout: true,
      showEndDialog: true,
    }));
  }, [disconnect, stopMicrophone]);

  const handleEndWithoutSaving = useCallback(async () => {
    disconnect();
    stopMicrophone();
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
  }, [disconnect, stopMicrophone, historyEntryId, clearTranscript]);

  const handleEndAndSave = useCallback(async () => {
    try {
      disconnect();
      stopMicrophone();
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
      console.error("Failed to save and complete:", error);
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
  }, [disconnect, stopMicrophone, saveAndComplete, historyEntryId, router]);

  const handleSendMessage = useCallback(
    (message: string) => {
      sendTextMessage(message);
    },
    [sendTextMessage]
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

  return (
    <div className="grid lg:grid-cols-[max-content,1fr] grid-cols-1 gap-4 lg:gap-4 h-[calc(100vh-4rem)] grid-rows-[auto,1fr] lg:grid-rows-1 p-4">
      <div className="mx-auto lg:mx-0">
        <Card className="w-[448px] max-w-full">
          <CardHeader className="pb-0">
            <CountdownBar
              initialMinutes={HARD_TIMEOUT_MINUTES}
              onCountdownComplete={handleCountdownComplete}
              isActive={chatState.isConversationActive}
            />
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <audio ref={audioRef} className="hidden" />
            <RolePlayersContainer
              rolePlayers={rolePlayers}
              activeRolePlayer={rolePlayers[0]?.name ?? ""}
              isInConversation={chatState.isConversationActive}
            >
              <AudioVisualiser audioRef={audioRef} />
            </RolePlayersContainer>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={chatState.isConversationActive ? "danger" : "brand"}
                onClick={handleToggleConversation}
                className="w-48"
              >
                {chatState.isConversationActive ? (
                  <span className="flex items-center">
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Conversation
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
              isEnabled={chatState.isConversationActive}
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

      <div className="h-full overflow-hidden">
        <Tabs defaultValue="instructions" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>
          <TabsContent
            value="instructions"
            className="flex-1 mt-4 overflow-auto"
          >
            <Card className="h-full">
              <CardContent className="pt-6">
                {module.instructions ? (
                  <MemoizedMarkdown content={module.instructions} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No instructions available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="transcript" className="flex-1 mt-4 overflow-auto">
            <Card className="h-full">
              <CardContent className="pt-6">
                <TranscriptDisplay transcriptEntries={transcriptEntries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
