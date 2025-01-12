"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback } from "react";
import { ConnectionDetails } from "@/app/livekit/connection-details/route";
import { Module } from "@/data/modules";
import { useRouter } from "next/navigation";
import {
  AgentState,
  LiveKitRoom,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  useRoomContext,
} from "@livekit/components-react";
import { MediaDeviceFailure } from "livekit-client";
import { useState, useRef, useEffect } from "react";
import { useTranscriptSave } from "@/hooks/use-transcript-save";
import { createHistoryEntryAction } from "@/app/actions/history-actions";
import { Button } from "@/components/ui/button";
import { RolePlayersContainer } from "@/components/roleplayers-container";
import { useTranscriptionHandler } from "@/hooks/use-transcription-handler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RolePlayer } from "@/types/chat-types";
import { CloseIcon } from "@/components/icons/close-icon";
import { User } from "@/data/user";
import { TranscriptBox } from "@/components/transcript-box";

type LiveKitChatProps = {
  module: Module;
  currentUser: User;
};

export default function LiveKitChat({ module, currentUser }: LiveKitChatProps) {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [historyEntryId, setHistoryEntryId] = useState<number>();
  const [transcriptBuffer, setTranscriptBuffer] = useState<
    Array<{ participantName: string; text: string }>
  >([]);
  const router = useRouter();

  const { saveAndComplete } = useTranscriptSave({
    historyEntryId,
    transcriptBuffer,
    saveInterval: 30000, // 30 seconds
  });

  const onEndCall = useCallback(
    (historyEntryId: number) => {
      router.push(`/assessments/${historyEntryId}`);
    },
    [router]
  );

  const onConnectButtonClicked = useCallback(async () => {
    try {
      setAgentState("connecting");

      const newHistoryEntryId = await createHistoryEntryAction(module.id);
      setHistoryEntryId(newHistoryEntryId);

      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ??
          "/livekit/connection-details",
        window.location.origin
      );
      url.searchParams.set("moduleId", module.id.toString());
      const response = await fetch(url.toString());
      const connectionDetailsData = await response.json();
      updateConnectionDetails(connectionDetailsData);
    } catch (error) {
      setAgentState("disconnected");
      console.error("Failed to start conversation:", error);
    }
  }, [module.id]);

  const handleDisconnect = useCallback(async () => {
    updateConnectionDetails(undefined);
    await saveAndComplete();
    setAgentState("disconnected");
    onEndCall(historyEntryId ?? 0);
  }, [saveAndComplete, onEndCall]);

  const rolePlayers = module.modulePrompt.characters.map(
    (character) =>
      ({
        name: character.name,
        agentName: "agent",
        avatarUrl: character.avatarUrl,
      } as RolePlayer)
  );

  return (
    <div
      data-lk-theme="default"
      className="h-full flex flex-col bg-[var(--lk-bg)]"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={handleDisconnect}
        className="flex flex-col h-full"
      >
        <LiveKitContainer
          onStateChange={setAgentState}
          onTranscriptUpdate={setTranscriptBuffer}
          rolePlayers={rolePlayers}
          currentUser={currentUser}
        />
        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
          onDisconnect={handleDisconnect}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

type LiveKitContainerProps = {
  onStateChange: (state: AgentState) => void;
  onTranscriptUpdate: (
    transcript: Array<{ participantName: string; text: string }>
  ) => void;
  rolePlayers: RolePlayer[];
  currentUser: User;
};

function LiveKitContainer({
  onStateChange,
  onTranscriptUpdate,
  rolePlayers,
  currentUser,
}: LiveKitContainerProps) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();
  const { transcriptBuffer, currentAgentText } = useTranscriptionHandler({
    room,
    rolePlayers,
    currentUser,
  });

  // Update parent component whenever transcriptBuffer changes
  useEffect(() => {
    onTranscriptUpdate(transcriptBuffer);
  }, [transcriptBuffer, onTranscriptUpdate]);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  return (
    <div className="flex-1 px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto h-full">
        <div className="flex flex-col gap-12">
          <RolePlayersContainer
            rolePlayers={rolePlayers}
            activeRolePlayer={rolePlayers[0]?.name ?? ""}
            isInConversation={state !== "disconnected"}
          >
            <BarVisualizer
              state={state}
              barCount={7}
              trackRef={audioTrack}
              className="[&>.lk-audio-bar]:w-[4px] [&>.lk-audio-bar]:mx-[2px] [&.lk-audio-bar-visualizer]:gap-1"
              options={{ minHeight: 4 }}
            />
          </RolePlayersContainer>

          <div className="flex justify-center">
            <TranscriptBox text={currentAgentText} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
  onDisconnect: () => Promise<void>;
  agentState: AgentState;
}) {
  return (
    <div className="flex justify-center items-center h-28 bg-background/50 backdrop-blur-sm border-t">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl 
              font-medium shadow-sm hover:opacity-90 transition-all"
            onClick={props.onConnectButtonClicked}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState !== "disconnected" && props.agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectAlertDialog onDisconnect={props.onDisconnect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DisconnectAlertDialog({
  onDisconnect,
}: {
  onDisconnect: () => Promise<void>;
}) {
  const room = useRoomContext();

  const handleConfirmedDisconnect = async () => {
    await onDisconnect();
    room.disconnect();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="lk-button lk-disconnect-button">
          <CloseIcon />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to end this conversation? Your transcript will
            be saved and analyzed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmedDisconnect}>
            End Conversation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
