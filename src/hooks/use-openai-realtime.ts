import { CURRENT_MODEL_NAMES } from "@/types/models";
import { createOpenAISession } from "@/app/actions/openai-session";
import { useRef, useState } from "react";
import { useTranscript } from "@/contexts/transcript";
import { useApiKey } from "./use-api-key";
import { logger } from "@/lib/logger";

export type OpenAIRealtimeProps = {
  instructions: string;
  voice: string;
  audioRef: React.RefObject<HTMLAudioElement> | null;
  userName: string;
  agentName: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServerEvent = {
  type: string;
  event_id?: string;
  item_id?: string;
  transcript?: string;
  delta?: string;
  session?: {
    id?: string;
  };
  item?: {
    id?: string;
    object?: string;
    type?: string;
    status?: string;
    name?: string;
    arguments?: string;
    role?: "user" | "assistant";
    content?: {
      type?: string;
      transcript?: string | null;
      text?: string;
    }[];
  };
  response?: {
    output?: {
      type?: string;
      name?: string;
      arguments?: any;
      call_id?: string;
    }[];
    status?: string;
    status_details?: {
      error?: any;
    };
    usage?: {
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
      input_token_details: {
        cached_tokens: number;
        text_tokens: number;
        audio_tokens: number;
        cached_tokens_details: {
          text_tokens: number;
          audio_tokens: number;
        };
      };
      output_token_details: {
        text_tokens: number;
        audio_tokens: number;
      };
    };
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Usage = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  inputTokenDetails: {
    cachedTokens: number;
    textTokens: number;
    audioTokens: number;
    cachedTokensDetails: {
      textTokens: number;
      audioTokens: number;
    };
  };
  outputTokenDetails: {
    textTokens: number;
    audioTokens: number;
  };
};

export function useOpenAIRealtime({
  instructions,
  voice,
  audioRef,
  userName,
  agentName,
}: OpenAIRealtimeProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const providerUrl = "https://api.openai.com/v1/realtime";
  const model = CURRENT_MODEL_NAMES.OPENAI;
  const [usage, setUsage] = useState<Usage | null>(null);
  const {
    transcriptEntries,
    addTranscriptMessage,
    updateTranscriptEntryStatus,
    updateTranscriptMessage,
  } = useTranscript();
  const { apiKey } = useApiKey();

  const tokenFetcher = async () => {
    try {
      const { session } = await createOpenAISession({
        apiKey: apiKey || undefined,
        instructions: instructions,
        voice: voice,
      });
      return session.client_secret.value;
    } catch (error) {
      // Check if it's a credit error
      if (error instanceof Error && error.message === "No credits available") {
        throw new Error("No credits available");
      }
      // Re-throw other errors
      throw error;
    }
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sendClientEvent = (eventObj: any) => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(JSON.stringify(eventObj));
    } else {
      logger.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const updateSession = () => {
    sendClientEvent({ type: "input_audio_buffer.clear" });

    const turnDetection = {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200,
      create_response: true,
    };

    const updateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: turnDetection,
      },
    };

    sendClientEvent(updateEvent);
  };

  const cancelAssistantSpeech = async () => {
    const mostRecentAgentMessage = [...transcriptEntries]
      .reverse()
      .find((entry) => entry.role === "agent");

    if (!mostRecentAgentMessage) {
      logger.warn("can't cancel, no recent assistant message found");
      return;
    }
    if (mostRecentAgentMessage.status === "DONE") {
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAgentMessage?.id,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAgentMessage.createdAtMs,
    });
    sendClientEvent({ type: "response.cancel" });
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const serverEvent = JSON.parse(event.data) as ServerEvent;

      switch (serverEvent.type) {
        case "session.created":
          updateSession();
          break;

        case "conversation.item.created": {
          let text =
            serverEvent.item?.content?.[0]?.text ||
            serverEvent.item?.content?.[0]?.transcript ||
            "";

          const role = serverEvent.item?.role === "user" ? "user" : "agent";
          const entryId = serverEvent.item?.id;
          const name = role === "user" ? userName : agentName;
          if (
            entryId &&
            transcriptEntries.some((entry) => entry.id === entryId)
          ) {
            break;
          }

          if (entryId) {
            if (role === "user" && !text) {
              text = "[Transcribing...]";
            }
            addTranscriptMessage(entryId, name, role, text);
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const entryId = serverEvent.item_id;
          const finalTranscript =
            !serverEvent.transcript || serverEvent.transcript === "\n"
              ? "[inaudible]"
              : serverEvent.transcript;
          if (entryId) {
            updateTranscriptMessage(entryId, finalTranscript, false);
          }
          break;
        }

        case "response.audio_transcript.delta": {
          const entryId = serverEvent.item_id;
          const deltaText = serverEvent.delta || "";
          if (entryId) {
            updateTranscriptMessage(entryId, deltaText, true);
          }
          break;
        }

        case "response.audio_transcript.done": {
          const entryId = serverEvent.item_id;
          const finalTranscript = serverEvent.transcript || "";
          if (entryId) {
            updateTranscriptMessage(entryId, finalTranscript, false);
          }
          break;
        }

        case "response.output_item.done": {
          const entryId = serverEvent.item?.id;
          if (entryId) {
            updateTranscriptEntryStatus(entryId, "DONE");
          }
          break;
        }

        case "response.done": {
          const usageData = serverEvent.response?.usage;
          if (usageData) {
            logger.info("State:", serverEvent.response?.status);
            logger.info("Token Usage:", usageData);
            setUsage({
              totalTokens: usageData.total_tokens,
              inputTokens: usageData.input_tokens,
              outputTokens: usageData.output_tokens,
              inputTokenDetails: {
                cachedTokens: usageData.input_token_details.cached_tokens,
                textTokens: usageData.input_token_details.text_tokens,
                audioTokens: usageData.input_token_details.audio_tokens,
                cachedTokensDetails: {
                  textTokens:
                    usageData.input_token_details.cached_tokens_details
                      .text_tokens,
                  audioTokens:
                    usageData.input_token_details.cached_tokens_details
                      .audio_tokens,
                },
              },
              outputTokenDetails: {
                textTokens: usageData.output_token_details.text_tokens,
                audioTokens: usageData.output_token_details.audio_tokens,
              },
            });
          }
          break;
        }
      }
    } catch (error) {
      logger.error("Failed to parse data channel message:", error);
    }
  };

  const registerHandlers = (dataChannel: RTCDataChannel) => {
    dataChannel.addEventListener("message", handleMessage);

    dataChannel.addEventListener("error", (error) => {
      logger.error("Data channel error:", error);
    });
  };

  async function connect(localStream: MediaStream) {
    const ephemeralKey = await tokenFetcher();

    const connection = new RTCPeerConnection();
    peerConnectionRef.current = connection;

    // Setup remote audio playback
    const audioElement = audioRef?.current;
    if (audioElement) {
      audioElement.autoplay = true;
      connection.ontrack = (event) => {
        audioElement.srcObject = event.streams[0];
      };
    }

    // Create and store the data channel reference
    const dataChannel = connection.createDataChannel("provider-data");
    dataChannelRef.current = dataChannel;
    registerHandlers(dataChannel);

    // Add the local microphone tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });
    }

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    const response = await fetch(`${providerUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
    });

    const answerSDP = await response.text();
    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: answerSDP,
    };
    await connection.setRemoteDescription(answer);
    return connection;
  }

  async function disconnect() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef && audioRef.current) {
      audioRef.current.srcObject = null;
    }
    dataChannelRef.current = null;
  }

  async function sendTextMessage(text: string) {
    await cancelAssistantSpeech();

    sendClientEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: text.trim() }],
      },
    });

    sendClientEvent({ type: "response.create" });
  }

  return { connect, disconnect, sendTextMessage, usage };
}
