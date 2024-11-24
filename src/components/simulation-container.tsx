"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceSimulationComponent } from "@/components/voice-simulation";
import { ChatSimulationComponent } from "@/components/chat-simulation";
import { useRouter } from "next/navigation";
import { Module } from "@/data/modules";

type SimulationContainerProps = {
  module: Module;
};

export function SimulationContainer({ module }: SimulationContainerProps) {
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationType, setSimulationType] = useState<"voice" | "chat" | null>(null);
  const router = useRouter();

  const startSimulation = (type: "voice" | "chat") => {
    setSimulationType(type);
    setSimulationStarted(true);
  };

  if (!simulationStarted) {
    return (
      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voice">Voice Simulation</TabsTrigger>
          <TabsTrigger value="chat">Chat Simulation</TabsTrigger>
        </TabsList>
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Simulation</CardTitle>
              <CardDescription>
                Simulate a voice call conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => startSimulation("voice")}>
                Start Voice Simulation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat Simulation</CardTitle>
              <CardDescription>
                Simulate a text-based chat conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => startSimulation("chat")}>
                Start Chat Simulation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  }

  if (simulationType === "voice") {
    return (
      <VoiceSimulationComponent 
        module={module}
        onEndCall={(historyId) => router.push(`/assessments/${historyId}`)}
      />
    );
  }

  return (
    <ChatSimulationComponent 
      onEndConversation={() => router.push(`/trainings/${module.trainingId}`)}
      module={module}
    />
  );
} 