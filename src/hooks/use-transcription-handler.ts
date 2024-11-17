import { useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  TranscriptionSegment,
  ParticipantKind,
} from "livekit-client";

type TranscriptEntry = {
  participantName: string;
  text: string;
  timestamp: number;
};

type UseTranscriptionHandlerReturn = {
  transcriptBuffer: TranscriptEntry[];
  currentAgentText: string;
};

export function useTranscriptionHandler(
  room: Room | null
): UseTranscriptionHandlerReturn {
  const [transcriptBuffer, setTranscriptBuffer] = useState<TranscriptEntry[]>(
    []
  );
  const [currentAgentText, setCurrentAgentText] = useState<string>("");

  useEffect(() => {
    if (!room) return;

    const updateTranscriptions = (
      segments: TranscriptionSegment[],
      participant: any
    ) => {
      const isAgent = participant.kind === ParticipantKind.AGENT;
      const participantId = participant?.identity || "Unknown";

      if (isAgent) {
        segments.forEach((segment) => {
          if (!segment.final) {
            setCurrentAgentText(segment.text);
          } else {
            setTranscriptBuffer((prev) => [
              ...prev,
              {
                participantName: participantId,
                text: segment.text,
                timestamp: segment.firstReceivedTime,
              },
            ]);
            setCurrentAgentText("");
          }
        });
      } else {
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

  return { transcriptBuffer, currentAgentText };
}
