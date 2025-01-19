"use client";

import { Module } from "@/data/modules";
import { User } from "@/data/user";
import React, { useRef, useState, useEffect } from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { useAudioStream } from "@/hooks/use-audio-stream";
import { createOpenAISession } from "@/app/actions/openai-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import AudioVisualiser from "@/components/audio-visualiser";
import { RolePlayersContainer } from "@/components/roleplayers-container";
import { RolePlayer } from "@/types/chat-types";
import { useDataChannel } from "@/hooks/use-data-channel";
import { ModulePrompt } from "@/data/modules";
import { DEFAULT_VOICE, CURRENT_MODEL_NAMES } from "@/types/models";
import {
  createHistoryEntryAction,
  deleteHistoryEntryAction,
} from "@/app/actions/history-actions";
import { TranscriptEntry } from "@/types/chat-types";
import { useTranscriptSave } from "@/hooks/use-transcript-save";
import { EndChatDialog } from "@/components/end-chat-dialog";
import { useRouter } from "next/navigation";
import { getStoredApiKey } from "@/utils/apikey";
import { CountdownBar } from "@/components/countdown-bar";
import { ChatTextEntry } from "@/components/chat-text-entry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/markdown-renderer";

type ChatProps = {
  module: Module;
  currentUser: User;
};

function createPrompt(modulePrompt: ModulePrompt) {
  let rolePlayInstruction =
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [historyEntryId, setHistoryEntryId] = useState<number>();
  const [history, setHistory] = useState<TranscriptEntry[]>([]);
  const { saveTranscript, saveAndComplete } = useTranscriptSave({
    historyEntryId,
    transcriptBuffer: history,
    saveInterval: 20000,
  });
  const [showEndDialog, setShowEndDialog] = useState(false);
  const router = useRouter();
  const [isTimeout, setIsTimeout] = useState(false);

  const {
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
    microphoneStream,
  } = useMicrophone();

  const providerUrl = "https://api.openai.com/v1/realtime";
  const model = CURRENT_MODEL_NAMES.OPENAI;

  const tokenFetcher = async () => {
    const storedApiKey = await getStoredApiKey();
    const { session } = await createOpenAISession({
      apiKey: storedApiKey || undefined,
      instructions: createPrompt(module.modulePrompt),
      voice: module.modulePrompt.characters[0]?.voice || DEFAULT_VOICE,
    });
    return session.client_secret.value;
  };

  const { connect, disconnect, dataChannel } = useAudioStream({
    model,
    providerUrl,
    tokenFetcher,
    audioRef,
  });

  const addUserTranscript = (transcript: string) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      { participantName: "user", text: transcript },
    ]);
  };

  const addAgentTranscript = (transcript: string) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      { participantName: "agent", text: transcript },
    ]);
  };

  useDataChannel(dataChannel, addUserTranscript, addAgentTranscript);

  const handleToggleConversation = async () => {
    if (isConversationActive) {
      setShowEndDialog(true);
    } else {
      const micStream = await startMicrophone();
      const connection = await connect(micStream);

      const newHistoryEntryId = await createHistoryEntryAction(module.id);
      setHistoryEntryId(newHistoryEntryId);

      setIsConversationActive(true);
    }
  };

  const handleEndWithoutSaving = async () => {
    disconnect();
    stopMicrophone();
    if (historyEntryId) {
      await deleteHistoryEntryAction(historyEntryId);
      setHistoryEntryId(undefined);
    }
    setIsConversationActive(false);
    setShowEndDialog(false);
  };

  const handleEndAndSave = async () => {
    disconnect();
    stopMicrophone();
    setIsConversationActive(false);
    await saveAndComplete();
    setShowEndDialog(false);
    if (historyEntryId) {
      router.push(`/assessments/${historyEntryId}`);
    }
  };

  const handleCountdownComplete = () => {
    disconnect();
    stopMicrophone();
    setIsTimeout(true);
    setShowEndDialog(true);
  };

  const rolePlayers: RolePlayer[] = module.modulePrompt.characters.map(
    (character) => ({
      name: character.name,
      agentName: "agent",
      avatarUrl: character.avatarUrl || "/placeholder.png",
    })
  );

  const handleSendMessage = (message: string) => {
    addUserTranscript(message);
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-0">
          <CountdownBar
            initialMinutes={0.1}
            onCountdownComplete={handleCountdownComplete}
            isActive={isConversationActive}
          />
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <audio ref={audioRef} className="hidden" />
          <RolePlayersContainer
            rolePlayers={rolePlayers}
            activeRolePlayer={rolePlayers[0]?.name ?? ""}
            isInConversation={isConversationActive}
          >
            <AudioVisualiser audioRef={audioRef} />
          </RolePlayersContainer>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant={isConversationActive ? "destructive" : "default"}
              onClick={handleToggleConversation}
              className="w-48"
            >
              {isConversationActive ? (
                <span className="flex items-center">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Conversation
                </span>
              ) : (
                <span className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-green-500" />
                  Start Conversation
                </span>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
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
            isEnabled={isConversationActive}
          />
        </CardContent>
        <EndChatDialog
          isOpen={showEndDialog}
          onOpenChange={setShowEndDialog}
          onEndChat={handleEndWithoutSaving}
          onEndAndSave={handleEndAndSave}
          isTimeout={isTimeout}
        />
      </Card>

      <Tabs defaultValue="transcript" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="instructions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {module.instructions ? (
                <MarkdownRenderer content={module.instructions} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No instructions available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                Transcript will be displayed here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
