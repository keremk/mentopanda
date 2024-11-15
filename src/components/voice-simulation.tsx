"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "@/app/livekit/connection-details/route";
import { NoAgentNotification } from "@/components/no-agent-notification";
import { CloseIcon } from "@/components/icons/close-icon";
// import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import type { ModuleProgress } from "@/data/trainings";
import { RoomEvent, TranscriptionSegment } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";
import { updateHistoryEntryAction } from "@/app/(app)/historyActions";
import { createHistoryEntryAction } from "@/app/(app)/historyActions";

type VoiceSimulationProps = {
  trainingId: string;
  module: ModuleProgress;
  onEndCall: () => void;
};

export function VoiceSimulationComponent({
  trainingId,
  module,
  onEndCall,
}: VoiceSimulationProps) {
  const [connectionDetails, updateConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [historyEntryId, setHistoryEntryId] = useState<number>();

  // useEffect(() => {
  //   if (agentState === "disconnected" && historyEntryId) {
  //     updateHistoryEntryAction({
  //       id: historyEntryId,
  //       completedAt: new Date(),
  //     }).catch(console.error);
  //   }
  // }, [agentState, historyEntryId]);

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

  const handleDisconnect = useCallback(() => {
    updateConnectionDetails(undefined);
    if (historyEntryId) {
      updateHistoryEntryAction({
        id: historyEntryId,
        completedAt: new Date(),
      }).catch(console.error);
    }
    setAgentState("disconnected");
  }, [historyEntryId]);

  return (
    <div
      data-lk-theme="default"
      className="h-full grid content-center bg-[var(--lk-bg)]"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={handleDisconnect}
        className="grid grid-rows-[2fr_1fr] items-center"
      >
        <SimpleVoiceAssistant
          onStateChange={setAgentState}
          historyEntryId={historyEntryId}
        />
        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
        />
        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </LiveKitRoom>
    </div>
  );
}

type TranscriptEntry = {
  participantName: string;
  text: string;
  timestamp: number;
};

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
  historyEntryId?: number;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();
  const [transcriptBuffer, setTranscriptBuffer] = useState<TranscriptEntry[]>(
    []
  );
  const [currentAgentText, setCurrentAgentText] = useState<string>("");

  // Function to save transcript buffer
  const saveTranscriptBuffer = useCallback(async () => {
    if (!props.historyEntryId || transcriptBuffer.length === 0) return;

    const formattedTranscript = transcriptBuffer
      .map((entry) => `${entry.participantName}: ${entry.text}`)
      .join("\n");

    try {
      await updateHistoryEntryAction({
        id: props.historyEntryId,
        transcript: formattedTranscript,
      });
    } catch (error) {
      console.error("Failed to save transcript:", error);
    }
  }, [transcriptBuffer, props.historyEntryId]);

  // Set up periodic saving
  useEffect(() => {
    const intervalId = setInterval(saveTranscriptBuffer, 30000); // Save every 30 seconds

    return () => {
      clearInterval(intervalId);
      saveTranscriptBuffer(); // Save one final time when component unmounts
    };
  }, [saveTranscriptBuffer]);

  useEffect(() => {
    if (!room) return;

    const updateTranscriptions = (
      segments: TranscriptionSegment[],
      participant: any
    ) => {
      const participantId = participant?.identity || "Unknown";

      // Only process agent transcripts for display
      if (participantId === "Agent") {
        segments.forEach((segment) => {
          if (!segment.final) {
            // Update current agent text for display
            setCurrentAgentText(segment.text);
          } else {
            // Add to transcript buffer for saving
            setTranscriptBuffer((prev) => [
              ...prev,
              {
                participantName: participantId,
                text: segment.text,
                timestamp: segment.firstReceivedTime,
              },
            ]);
            // setCurrentAgentText(""); // Clear current text
          }
        });
      } else {
        // For non-agent participants, just add to buffer when final
        segments.forEach((segment) => {
          if (segment.final) {
            setTranscriptBuffer((prev) => [
              ...prev,
              {
                participantName: participantId,
                text: segment.text,
                timestamp: segment.firstReceivedTime,
              },
            ]);
          }
        });
      }
    };

    room.on(RoomEvent.TranscriptionReceived, updateTranscriptions);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, updateTranscriptions);
    };
  }, [room]);

  useEffect(() => {
    props.onStateChange(state);
  }, [state, props.onStateChange]);

  return (
    <div className="h-[300px] max-w-[90vw] mx-auto flex flex-col gap-4">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />

      {/* Horizontal scrolling transcript box */}
      <div className="relative w-full h-12 flex items-center justify-center">
        <div className="w-full max-w-[80%] h-10 overflow-x-auto whitespace-nowrap bg-[var(--lk-bg)] rounded-lg flex items-center px-4">
          <div key={currentAgentText}>
            {currentAgentText || "Waiting for agent response..."}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
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
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
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
              initial={{ opacity: 0, top: "10px" }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
            >
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
