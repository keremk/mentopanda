import { useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  TranscriptionSegment,
  ParticipantKind,
  Participant as LiveKitParticipant,
} from "livekit-client";
import { RolePlayer } from "@/types/chat-types";
import { User } from "@/data/user";

type TranscriptEntry = {
  participantName: string;
  text: string;
  timestamp: number;
};

type UseTranscriptionHandlerReturn = {
  transcriptBuffer: TranscriptEntry[];
  currentAgentText: string;
};

type UseTranscriptionHandlerProps = {
  room: Room;
  rolePlayers: RolePlayer[];
  currentUser: User;
};

export function useTranscriptionHandler({
  room,
  rolePlayers,
  currentUser,
}: UseTranscriptionHandlerProps): UseTranscriptionHandlerReturn {
  const [transcriptBuffer, setTranscriptBuffer] = useState<TranscriptEntry[]>(
    []
  );
  const [currentAgentText, setCurrentAgentText] = useState<string>("");

  useEffect(() => {
    const updateTranscriptions = (
      segments: TranscriptionSegment[],
      participant: LiveKitParticipant | undefined
    ) => {
      // const isAgent = participant?.kind === ParticipantKind.AGENT;
      const transcriptParticipantName = participant?.identity || "Unknown";
      const isCurrentUser = transcriptParticipantName === currentUser.displayName;

      if (isCurrentUser) {
        const participantName = currentUser.displayName;
        segments.forEach((segment) => {
          if (segment.final) {
            setTranscriptBuffer((prev) => [
              ...prev,
              {
                participantName: participantName,
                text: segment.text,
                timestamp: segment.firstReceivedTime,
              },
            ]);
          }
        });
      } else {
        const participantName = resolveAgentName(transcriptParticipantName, rolePlayers);
        segments.forEach((segment) => {
          if (!segment.final) {
            setCurrentAgentText(segment.text);
          } else {
            setTranscriptBuffer((prev) => [
              ...prev,
              {
                participantName: participantName,
                text: segment.text,
                timestamp: segment.firstReceivedTime,
              },
            ]);
            setCurrentAgentText("");
          }
        });
      };
    };

    room.on(RoomEvent.TranscriptionReceived, updateTranscriptions);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, updateTranscriptions);
    };
  }, [room]);

  return { transcriptBuffer, currentAgentText };
}

function resolveAgentName(transcriptParticipantName: string, rolePlayers: RolePlayer[]) {
  return rolePlayers.find(
    (rolePlayer) => rolePlayer.agentName === transcriptParticipantName
  )?.agentName ?? rolePlayers[0]?.agentName;
}

