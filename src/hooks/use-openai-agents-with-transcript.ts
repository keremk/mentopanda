import { useCallback, useRef, useState, useEffect } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import { getToken } from "@/app/actions/openai-agents";
import { logger } from "@/lib/logger";
import { MODEL_NAMES, CURRENT_MODEL_NAMES } from "@/types/models";
import {
  updateConversationUsageAction,
  updateTranscriptionUsageAction,
} from "@/app/actions/usage-actions";
import { useTranscript } from "@/contexts/transcript";

// Type definitions based on OpenAI Agents SDK
type RealtimeContentItem =
  | { text: string; type: "input_text" }
  | { audio?: string | null; transcript: string | null; type: "input_audio" }
  | { text: string; type: "text" }
  | { audio?: string | null; transcript?: string | null; type: "audio" };

type RealtimeMessageItem = {
  itemId: string;
  previousItemId?: string | null;
  type: "message";
  role: "user" | "assistant" | "system";
  content: RealtimeContentItem[];
  status?: "in_progress" | "completed" | "incomplete";
};

export interface UseOpenAIAgentsWithTranscriptReturn {
  // Session state
  isConnected: boolean;
  isConnecting: boolean;

  // Audio state
  isSpeaking: boolean;

  // Controls
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (message: string) => void;

  // Error handling
  error: string | null;

  // Audio refs for SpeakingBubble
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // Transcription model
  transcriptionModel: string | null;
}

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

export function useOpenAIAgentsWithTranscript(
  agent: RealtimeAgent,
  userName: string,
  agentName: string,
  saveFinalTranscript?: (finalHistory: unknown[]) => Promise<void>
): UseOpenAIAgentsWithTranscriptReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Usage will be accessed directly from session.usage
  const [transcriptionModel, setTranscriptionModel] = useState<string | null>(
    null
  );

  const sessionRef = useRef<RealtimeSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const currentTranscriptEntryRef = useRef<string | null>(null);

  // Log state changes for debugging
  useEffect(() => {
    logger.debug("🔄 [useOpenAIAgentsWithTranscript] State changed:", {
      isConnected,
      isConnecting,
      hasSession: !!sessionRef.current,
      hasAudio: !!audioRef.current,
      agentName: agent?.name || "no-agent",
    });
  }, [isConnected, isConnecting, agent]);

  const {
    transcriptEntries,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptEntryStatus,
  } = useTranscript();

  const transcriptEntriesRef = useRef(transcriptEntries);

  // Keep transcriptEntriesRef current
  useEffect(() => {
    transcriptEntriesRef.current = transcriptEntries;
  }, [transcriptEntries]);

  // Set up audio event listeners to track speaking state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      logger.debug("Audio started playing");
      setIsSpeaking(true);
    };

    const handlePause = () => {
      logger.debug("Audio paused");
      setIsSpeaking(false);
    };

    const handleEnded = () => {
      logger.debug("Audio ended");
      setIsSpeaking(false);
    };

    // Add event listeners
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("playing", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("emptied", handlePause);

    // Cleanup
    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("playing", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("emptied", handlePause);
    };
  }, []);

  const logUsageMetrics = useCallback(async () => {
    logger.info("[logUsageMetrics] Attempting to log usage metrics.");

    if (sessionStartTimeRef.current === null) {
      logger.warn(
        "[logUsageMetrics] Session start time is null. Skipping metrics logging."
      );
      return;
    }

    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - sessionStartTimeRef.current) / 1000;

    // Calculate character counts from transcript
    let totalUserChars = 0;
    let totalAgentChars = 0;

    transcriptEntries.forEach((entry) => {
      if (entry.role === "user" && entry.text) {
        totalUserChars += entry.text.length;
      } else if (entry.role === "agent" && entry.text) {
        totalAgentChars += entry.text.length;
      }
    });

    // Get usage from session instead of transport events
    const sessionUsage = sessionRef.current?.usage as unknown as Record<
      string,
      unknown
    >;
    if (sessionUsage) {
      try {
        // Use simple approximation like the original hook - TODO: improve when SDK provides better data
        console.log("Session usage data:", JSON.stringify(sessionUsage));
        await updateConversationUsageAction({
          modelName: MODEL_NAMES.OPENAI_REALTIME,
          promptTokens: {
            text: {
              cached: 0,
              notCached: Math.max(0, Number(sessionUsage.inputTokens) || 0),
            },
            audio: {
              cached: 0,
              notCached: 0,
            },
          },
          outputTokens: {
            text: 0,
            audio: Number(sessionUsage.outputTokens) || 0,
          },
          totalTokens: Number(sessionUsage.totalTokens) || 0,
          totalSessionLength: elapsedTimeInSeconds,
        });
        logger.info("Conversation usage tracked successfully");
      } catch (error) {
        logger.error(`Failed to track conversation usage: ${error}`);
      }
    }

    // Track transcription usage
    if (totalUserChars > 0 || totalAgentChars > 0) {
      try {
        await updateTranscriptionUsageAction({
          modelName: transcriptionModel || MODEL_NAMES.OPENAI_TRANSCRIBE,
          totalSessionLength: elapsedTimeInSeconds,
          userChars: totalUserChars,
          agentChars: totalAgentChars,
        });
        logger.info("Transcription usage tracked successfully");
      } catch (error) {
        logger.error(`Failed to track transcription usage: ${error}`);
      }
    }

    sessionStartTimeRef.current = null;
  }, [transcriptEntries, transcriptionModel]);

  const disconnect = useCallback(() => {
    logger.debug("🔌 [disconnect] Called - getting stack trace");
    console.trace("disconnect() called from:");

    if (sessionRef.current) {
      logUsageMetrics();

      // Capture final history from OpenAI before closing session
      if (saveFinalTranscript) {
        try {
          const finalHistory = sessionRef.current.history || [];
          logger.debug("🔚 Capturing final session history for clean save:", {
            historyLength: finalHistory.length,
          });
          saveFinalTranscript(finalHistory).catch((err) => {
            logger.error("Failed to save final transcript:", err);
          });
        } catch (err) {
          logger.error("Error capturing final history:", err);
        }
      }

      try {
        // Clean up audio element
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.srcObject = null;
        }
        logger.info("Updating usage before closing session");
        // Properly close the RealtimeSession
        sessionRef.current.close();
        logger.info("RealtimeSession closed successfully");
      } catch (err) {
        logger.error("Error closing RealtimeSession:", err);
      } finally {
        sessionRef.current = null;
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setError(null);
    sessionStartTimeRef.current = null;
    currentTranscriptEntryRef.current = null;

    logger.info("RealtimeSession disconnected and cleaned up");
  }, [logUsageMetrics, saveFinalTranscript]);

  const createSession = useCallback(async () => {
    if (!agent) {
      throw new Error("Agent not provided");
    }
    if (!audioRef.current) {
      throw new Error("Audio element not available");
    }

    const clientToken = await getToken();
    logger.debug(
      "✅ Token received:",
      clientToken ? `Valid token` : "No token"
    );

    // Create custom WebRTC transport with our audio element
    const customTransport = new OpenAIRealtimeWebRTC({
      audioElement: audioRef.current,
    });
    logger.debug("✅ WebRTC transport created");

    logger.debug("🔗 Creating RealtimeSession...");
    const session = new RealtimeSession(agent, {
      transport: customTransport,
      model: CURRENT_MODEL_NAMES.OPENAI,
      config: {
        inputAudioFormat: "pcm16",
        outputAudioFormat: "pcm16",
        voice: agent.voice || "alloy",
        inputAudioTranscription: {
          // Align with GA realtime recommended transcription model
          model: "gpt-4o-mini-transcribe",
        },
      },
    });
    sessionRef.current = session;
    logger.debug("✅ RealtimeSession created");
    return { session, clientToken } as const;
  }, []);

  const connect = useCallback(async () => {
    // Prevent multiple connections
    if (isConnecting || isConnected) {
      logger.warn("Connection already in progress or active");
      return;
    }

    // Clean up any existing session first
    if (sessionRef.current) {
      logger.debug("🔗 [connect] Cleaning up existing session");
      disconnect();
    }

    setIsConnecting(true);
    setError(null);
    sessionStartTimeRef.current = Date.now();

    try {
      const { session, clientToken } = await createSession();

      // Set up event listeners for session events
      const handleError = (error: unknown) => {
        // SDK 'error' events are mostly informational; warn-log and do not mutate state
        try {
          const payload =
            typeof error === "object" && error && "error" in (error as any)
              ? (error as any).error
              : error;
          logger.warn("RealtimeSession SDK error:", payload);
        } catch {
          logger.warn("RealtimeSession SDK error (unparsed):", error);
        }
      };
      session.on("error", handleError);

      const handleDisconnect = () => {
        logger.info("RealtimeSession disconnected");
        setIsConnected(false);
        setIsConnecting(false);
        setIsSpeaking(false);
      };
      session.transport?.on("close", handleDisconnect);

      // Listen for new history items being added
      session.on("history_added", (item) => {
        logger.info("Event: history_added", JSON.stringify(item));

        // Handle RealtimeMessageItem
        if (item && typeof item === "object" && item.type === "message") {
          const messageItem = item as RealtimeMessageItem;
          const itemId = messageItem.itemId;

          // Skip if we already have this item - use ref
          if (
            transcriptEntriesRef.current.some((entry) => entry.id === itemId)
          ) {
            logger.debug(`Skipping duplicate item with id: ${itemId}`);
            return;
          }

          const role = messageItem.role === "user" ? "user" : "agent";
          const name = role === "user" ? userName : agentName;
          const status = messageItem.status;

          // Extract text from content array
          let text = "";
          if (Array.isArray(messageItem.content)) {
            messageItem.content.forEach((contentItem) => {
              // For user messages: input_text, input_audio
              if (contentItem.type === "input_text" && "text" in contentItem) {
                text += contentItem.text;
              } else if (
                contentItem.type === "input_audio" &&
                "transcript" in contentItem &&
                contentItem.transcript
              ) {
                text += contentItem.transcript;
              }
              // For assistant messages: text, audio
              else if (contentItem.type === "text" && "text" in contentItem) {
                text += contentItem.text;
              } else if (
                contentItem.type === "audio" &&
                "transcript" in contentItem &&
                contentItem.transcript
              ) {
                text += contentItem.transcript;
              }
            });
          }

          // Always add transcript entry, even if text is empty initially
          // This handles cases where transcript starts as null and gets updated later
          const displayText =
            text.trim() ||
            (role === "user" ? "[Transcribing...]" : "[Generating...]");
          addTranscriptMessage(itemId, name, role, displayText);

          // Set status based on the item's status
          if (status === "completed" || status === "incomplete") {
            updateTranscriptEntryStatus(itemId, "DONE");
          } else {
            updateTranscriptEntryStatus(itemId, "IN_PROGRESS");
          }
        }
      });

      // Also listen to history_updated for status and content changes
      session.on("history_updated", (history) => {
        logger.debug("Event: history_updated", JSON.stringify(history));

        // Update existing transcript entries with new status and content
        if (Array.isArray(history)) {
          history.forEach((item) => {
            if (item && typeof item === "object" && item.type === "message") {
              const messageItem = item as RealtimeMessageItem;
              const existingEntry = transcriptEntriesRef.current.find(
                (entry) => entry.id === messageItem.itemId
              );
              if (existingEntry) {
                // Extract current text from content
                let text = "";
                if (Array.isArray(messageItem.content)) {
                  logger.debug(
                    `[history_updated] Processing content for ${messageItem.itemId}:`,
                    JSON.stringify(messageItem.content)
                  );
                  messageItem.content.forEach((contentItem) => {
                    if (
                      contentItem.type === "input_text" &&
                      "text" in contentItem
                    ) {
                      text += contentItem.text;
                      logger.debug(
                        `[history_updated] Added input_text: "${contentItem.text}"`
                      );
                    } else if (
                      contentItem.type === "input_audio" &&
                      "transcript" in contentItem &&
                      contentItem.transcript
                    ) {
                      text += contentItem.transcript;
                      logger.debug(
                        `[history_updated] Added input_audio transcript: "${contentItem.transcript}"`
                      );
                    } else if (
                      contentItem.type === "text" &&
                      "text" in contentItem
                    ) {
                      text += contentItem.text;
                      logger.debug(
                        `[history_updated] Added text: "${contentItem.text}"`
                      );
                    } else if (
                      contentItem.type === "audio" &&
                      "transcript" in contentItem &&
                      contentItem.transcript
                    ) {
                      text += contentItem.transcript;
                      logger.debug(
                        `[history_updated] Added audio transcript: "${contentItem.transcript}"`
                      );
                    } else {
                      logger.debug(
                        `[history_updated] Skipped content item:`,
                        contentItem
                      );
                    }
                  });
                }

                // Update text if it's different and not empty
                if (text.trim() && text !== existingEntry.text) {
                  logger.info(
                    `[history_updated] Updating text for ${messageItem.itemId}: "${existingEntry.text}" -> "${text}"`
                  );
                  updateTranscriptMessage(messageItem.itemId, text, false);
                } else {
                  logger.debug(
                    `[history_updated] No text update needed for ${messageItem.itemId}: text="${text.trim()}", existing="${existingEntry.text}"`
                  );
                }

                // Update status if changed
                const newStatus =
                  messageItem.status === "completed" ||
                  messageItem.status === "incomplete"
                    ? "DONE"
                    : "IN_PROGRESS";
                if (existingEntry.status !== newStatus) {
                  updateTranscriptEntryStatus(messageItem.itemId, newStatus);
                }
              }
            }
          });
        }
      });

      session.on("transport_event", (event) => {
        logger.debug("Event: transport_event", event);
        switch (event.type) {
          case "response.done": {
            // logger.info(
            //   `Transport event: response.done for item ${JSON.stringify(event)}`
            // );
            logger.info(
              `Usage details: ${JSON.stringify(event.response.usage)}`
            );
            break;
          }
        }
      });

      // Listen for transport layer events if available
      // if (session.transport) {
      //   session.transport.on("close", handleDisconnect);
      //   session.transport.on("error", handleError);

      //   // Usage will be tracked via session.usage instead of transport events

      //   // Transcript handling moved to session.history events

      //   // Transcript completion handled via session.history events

      //   session.transport.on("open", () => {
      //     logger.info("Transport layer connected");
      //   });
      // }

      // Connect to OpenAI with the ephemeral token and transcription config
      logger.debug("📞 Connecting to OpenAI...");
      logger.debug("📞 Agent details:", {
        name: agent.name,
        voice: agent.voice,
        hasInstructions: !!agent.instructions,
      });

      // Log all parsed realtime events to help diagnose empty error payloads
      // (the SDK emits a '*' event with the parsed payload)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).on?.("*", (evt: unknown) => {
        try {
          logger.debug("Realtime '*' event:", JSON.stringify(evt));
        } catch {
          logger.debug("Realtime '*' event (raw)", evt as any);
        }
      });

      // Hook-local fetch wrapper: add Calls beta header only for the SDP handshake
      let _restoreFetch: (() => void) | null = null;
      if (typeof window !== "undefined" && typeof window.fetch === "function") {
        const _orig = window.fetch;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.fetch = (async (input: any, init?: RequestInit) => {
          try {
            const url =
              typeof input === "string"
                ? input
                : input instanceof URL
                  ? input.toString()
                  : (input as Request).url;
            if (url.startsWith("https://api.openai.com/v1/realtime/calls")) {
              const headers = new Headers(
                init?.headers ||
                  (typeof input !== "string" && !(input instanceof URL)
                    ? (input as Request).headers
                    : undefined)
              );
              if (!headers.has("OpenAI-Beta"))
                headers.set("OpenAI-Beta", "realtime=v1");
              return _orig(input, { ...init, headers });
            }
            return _orig(input, init);
          } catch {
            return _orig(input, init);
          }
        }) as typeof window.fetch;
        _restoreFetch = () => {
          window.fetch = _orig;
        };
      }

      // IMPORTANT for @openai/agents-realtime >=0.1.x: use Calls endpoint
      try {
        await session.connect({
          apiKey: clientToken,
          url: "https://api.openai.com/v1/realtime/calls?model=gpt-4o-realtime-preview-2025-06-03",
        });
      } catch (connectError) {
        logger.error("Error during session.connect():", connectError);
        throw connectError;
      }
      // } finally {
      //   try {
      //     _restoreFetch?.();
      //   } catch {}
      // }
      logger.debug("✅ Connected to OpenAI successfully");

      // Log session state
      logger.debug("📞 Session state after connect:", {
        hasSession: !!session,
        hasTransport: !!session.transport,
        transportType: session.transport?.constructor?.name,
      });

      // Set transcription model (assuming we're using the better model)
      setTranscriptionModel(MODEL_NAMES.OPENAI_TRANSCRIBE);

      // Session is now connected and audio will play through our audioElement
      setIsConnected(true);
      setIsConnecting(false);

      // Session is ready - agent will respond naturally to audio input

      logger.debug("🎉 RealtimeSession fully initialized and ready");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      logger.error("Failed to connect to OpenAI Agents:", err);
      setError(errorMessage);
      setIsConnecting(false);

      // Clean up on connection failure
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch (closeErr) {
          logger.error(
            "Error closing session after connection failure:",
            closeErr
          );
        }
        sessionRef.current = null;
      }
    }
  }, [
    isConnecting,
    isConnected,
    disconnect,
    agent,
    userName,
    agentName,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptEntryStatus,
  ]);

  const sendTextMessage = useCallback(
    async (message: string) => {
      if (!sessionRef.current) {
        logger.warn("Cannot send message: no active session");
        return;
      }

      try {
        // Add user message to transcript
        const entryId = `user-${Date.now()}`;
        addTranscriptMessage(entryId, userName, "user", message);
        updateTranscriptEntryStatus(entryId, "DONE");

        // Send message through the session
        await sessionRef.current.sendMessage(message);
        logger.debug("Text message sent successfully");
      } catch (err) {
        logger.error("Failed to send text message:", err);
      }
    },
    [userName, addTranscriptMessage, updateTranscriptEntryStatus]
  );

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    sendTextMessage,
    error,
    audioRef,
    transcriptionModel,
  };
}
