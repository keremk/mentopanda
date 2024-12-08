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
import { ParticipantContainer } from "@/components/participant-container";
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
import { Participant } from "@/types/chat-types";
import { CloseIcon } from "@/components/icons/close-icon";

type LiveKitChatProps = {
  module: Module;
};

export default function LiveKitChat({ module }: LiveKitChatProps) {
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

  const participants = module.modulePrompt.characters.map(
    (character) =>
      ({
        name: character.name,
        role: "agent",
        avatarUrl: `/avatars/${character.name}.jpg`,
      } as Participant)
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
          participants={participants}
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
  participants: Participant[];
};

function LiveKitContainer({
  onStateChange,
  onTranscriptUpdate,
  participants,
}: LiveKitContainerProps) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();
  const { transcriptBuffer, currentAgentText } = useTranscriptionHandler(room);

  // Update parent component whenever transcriptBuffer changes
  useEffect(() => {
    onTranscriptUpdate(transcriptBuffer);
  }, [transcriptBuffer, onTranscriptUpdate]);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  return (
    <div className="flex-1">
      <div className="container mx-auto h-full py-4">
        <div className="flex flex-col gap-8">
          <ParticipantContainer
            participants={participants}
            activeParticipant={participants[0]?.name ?? ""}
            isInConversation={state !== "disconnected"}
          >
            <BarVisualizer
              state={state}
              barCount={5}
              trackRef={audioTrack}
              className="border-2 border-red-500 [&>.lk-audio-bar]:w-[5px] [&>.lk-audio-bar]:mx-[2px] [&.lk-audio-bar-visualizer]:gap-1"
              options={{ minHeight: 30 }}
            />
          </ParticipantContainer>

          <div className="flex justify-center">
            <TranscriptBox text={currentAgentText} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TranscriptBox({ text }: { text: string }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [text]);

  return (
    <div className="relative w-full h-12 flex items-center justify-center">
      <div
        ref={scrollContainerRef}
        className="fixed-size w-[500px] h-10 overflow-x-auto whitespace-nowrap 
          bg-[var(--lk-bg)] rounded-lg flex items-center px-4
          scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden"
      >
        <div ref={textRef} className="flex-shrink-0 w-fit ">
          {text || "Waiting for agent response..."}
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
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  // const krisp = useKrispNoiseFilter();
  // useEffect(() => {
  //   krisp.setNoiseFilterEnabled(true);
  // }, []);

  return (
    <div className="flex justify-center items-center h-24">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-2 bg-white text-black rounded-md uppercase"
            onClick={props.onConnectButtonClicked}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2"
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
