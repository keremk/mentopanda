"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceSimulationComponent } from "@/components/voice-simulation";
import { ChatSimulationComponent } from "@/components/chat-simulation";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationType, setSimulationType] = useState<"voice" | "chat" | null>(
    null
  );
  const router = useRouter();
  const { trainingId, moduleId } = useParams();

  const startSimulation = (type: "voice" | "chat") => {
    setSimulationType(type);
    setSimulationStarted(true);
  };

  const assessmentId = 1;
  const endConversation = () => {
    router.push(`/trainings/assessments/${assessmentId}`);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Manager Training Simulation</CardTitle>
          <CardDescription>
            Practice your skills in 1:1 conversations for coaching, performance
            assessment, and team meeting facilitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Scenario:</h2>
          <p className="mb-4">
            You are conducting a performance review with an employee who has
            been struggling to meet deadlines. Your goal is to address the issue
            constructively and develop an improvement plan.
          </p>

          {!simulationStarted && (
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
          )}

          {simulationStarted && simulationType === "voice" && (
            <VoiceSimulationComponent onEndCall={endConversation} />
          )}

          {simulationStarted && simulationType === "chat" && (
            <ChatSimulationComponent onEndConversation={endConversation} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
