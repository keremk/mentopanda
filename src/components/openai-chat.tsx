"use client";

import { Module } from "@/data/modules";
import { User } from "@/data/user";
import React, { useRef, useState } from "react";
import { useMicrophone } from "@/hooks/use-microphone";
import { useAudioStream } from "@/hooks/use-audio-stream";
import { getSpeechToken } from "@/app/actions/openai-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

type ChatProps = {
  module: Module;
  currentUser: User;
};

export default function OpenAIChat({ module, currentUser }: ChatProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);

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

  const tokenFetcher = async () => {
    const { token } = await getSpeechToken({});
    return token.client_secret.value;
  };

  const { connect, disconnect } = useAudioStream({
    model,
    providerUrl,
    tokenFetcher,
    audioRef,
  });

  const handleToggleConversation = async () => {
    if (isConversationActive) {
      disconnect();
      stopMicrophone();
      setIsConversationActive(false);
    } else {
      const micStream = await startMicrophone();
      await connect(micStream);
      setIsConversationActive(true);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Voice Chat Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} className="hidden" />
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isConversationActive ? "destructive" : "default"}
            onClick={handleToggleConversation}
            className="w-48"
          >
            {isConversationActive ? (
              <>
                <PhoneOff className="mr-2 h-4 w-4" />
                End Conversation
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start Conversation
              </>
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
