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
import { DEFAULT_VOICE } from "@/types/models";
import { createHistoryEntryAction } from "@/app/actions/history-actions";
import { TranscriptEntry } from "@/types/chat-types";
import { useTranscriptSave } from "@/hooks/use-transcript-save";

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
  const [transcript, setTranscript] = useState<string>("");
  const [historyEntryId, setHistoryEntryId] = useState<number>();
  const [history, setHistory] = useState<TranscriptEntry[]>([]);
  const { saveTranscript, saveAndComplete } = useTranscriptSave({
    historyEntryId,
    transcriptBuffer: history,
    saveInterval: 20000,
  });

  const {
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
    microphoneStream,
  } = useMicrophone();

  const providerUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";

  console.log(createPrompt(module.modulePrompt));
  console.log(module.modulePrompt.characters[0]?.voice);
  const tokenFetcher = async () => {
    const { session } = await createOpenAISession({
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
      disconnect();
      stopMicrophone();
      setIsConversationActive(false);
      await saveAndComplete();
    } else {
      const micStream = await startMicrophone();
      const connection = await connect(micStream);

      const newHistoryEntryId = await createHistoryEntryAction(module.id);
      setHistoryEntryId(newHistoryEntryId);

      setIsConversationActive(true);
    }
  };
  const rolePlayers = module.modulePrompt.characters.map(
    (character) =>
      ({
        name: character.name,
        agentName: "agent",
        avatarUrl: `/avatars/${character.name}.jpg`,
      } as RolePlayer)
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Voice Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
