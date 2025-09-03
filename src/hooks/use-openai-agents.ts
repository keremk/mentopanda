import { useCallback, useRef, useState, useEffect } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import { getToken } from "@/app/actions/openai-agents";
import { logger } from "@/lib/logger";
import { MODEL_NAMES, CURRENT_MODEL_NAMES } from "@/types/models";
import { updateConversationUsageAction } from "@/app/actions/usage-actions";

export interface UseOpenAIAgentsReturn {
  // Session state
  isConnected: boolean;
  isConnecting: boolean;

  // Audio state
  isSpeaking: boolean;

  // Controls
  connect: () => Promise<void>;
  disconnect: () => void;

  // Error handling
  error: string | null;

  // Audio refs for SpeakingBubble
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useOpenAIAgents(agent: RealtimeAgent): UseOpenAIAgentsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track session start time for session length calculation
  const sessionStartTimeRef = useRef<number | null>(null);

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

  const updateUsage = useCallback(async () => {
    if (sessionRef.current) {
      try {
        const usage = sessionRef.current.usage;
        // Calculate elapsed time in seconds
        let elapsedTimeInSeconds = 0;
        if (sessionStartTimeRef.current) {
          elapsedTimeInSeconds = Math.round(
            (Date.now() - sessionStartTimeRef.current) / 1000
          );
        }
        logger.info("Usage:");
        logger.info("Input tokens:", usage?.inputTokens);
        logger.info("Output tokens:", usage?.outputTokens);
        logger.info(
          "Input tokens details:",
          JSON.stringify(usage?.inputTokensDetails)
        );
        logger.info(
          "Output tokens details:",
          JSON.stringify(usage?.outputTokensDetails)
        );
        logger.info("Total tokens:", usage?.totalTokens);
        logger.info("Elapsed time:", elapsedTimeInSeconds);
        // TODO: THIS IS A VERY ROUGH APPROXIMATION OF THE USAGE. WE NEED TO IMPROVE THIS. BUT THERE IS NO DATA COMING FROM OPENAI.
        await updateConversationUsageAction({
          modelName: MODEL_NAMES.OPENAI_REALTIME, // Fixed to match pricing data
          promptTokens: {
            text: {
              cached: 0,
              notCached: Math.max(0, usage?.inputTokens),
            },
            audio: {
              cached: 0,
              notCached: 0,
            },
          },
          outputTokens: {
            text: 0,
            audio: usage.outputTokens || 0,
          },
          totalTokens: usage.totalTokens || 0,
          totalSessionLength: elapsedTimeInSeconds,
        });
      } catch (err) {
        logger.error("Error updating usage:", err);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      updateUsage();
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
    // Reset session start time
    sessionStartTimeRef.current = null;

    logger.info("RealtimeSession disconnected and cleaned up");
  }, [updateUsage]);

  const connect = useCallback(async () => {
    // Prevent multiple connections
    if (isConnecting || isConnected) {
      logger.warn("Connection already in progress or active");
      return;
    }

    // Clean up any existing session first
    if (sessionRef.current) {
      disconnect();
    }

    setIsConnecting(true);
    setError(null);
    // Set session start time
    sessionStartTimeRef.current = Date.now();

    try {
      const clientToken = await getToken();
      logger.debug(
        "✅ Token received:",
        clientToken ? "Valid token" : "No token"
      );

      if (!agent) {
        throw new Error("Agent not provided");
      }
      logger.debug("🤖 Agent provided:", agent);

      if (!audioRef.current) {
        throw new Error("Audio element not available");
      }
      logger.debug("🎵 Audio element available");

      const customTransport = new OpenAIRealtimeWebRTC({
        audioElement: audioRef.current,
      });
      logger.debug("✅ WebRTC transport created");

      // Create session with the custom transport
      logger.debug("🔗 Creating RealtimeSession...");
      const session = new RealtimeSession(agent, {
        transport: customTransport,
      });
      sessionRef.current = session;
      logger.debug("✅ RealtimeSession created");

      // Set up event listeners for session events
      const handleError = (error: unknown) => {
        logger.warn("RealtimeSession error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { message?: string })?.message ||
              error?.toString() ||
              "Session error occurred";
        setError(errorMessage);
        setIsConnecting(false);
        setIsConnected(false);
      };

      const handleDisconnect = () => {
        logger.info("RealtimeSession disconnected");
        setIsConnected(false);
        setIsConnecting(false);
        setIsSpeaking(false);
      };

      // Listen for session errors
      session.on("error", handleError);
      session.on("transport_event", (event) => {
        logger.info("Transport event:", JSON.stringify(event));
      });

      // Listen for transport layer events if available
      if (session.transport) {
        session.transport.on("close", handleDisconnect);
        session.transport.on("error", handleError);
        session.transport.on("usage_update", (usage) => {
          logger.info("Usage updated:", JSON.stringify(usage));
        });
        session.transport.on("audio_transcript_delta", (delta) => {
          logger.info("Audio transcript delta:", JSON.stringify(delta));
        });

        session.transport.on("open", () => {
          logger.info("Transport layer connected");
        });
      }


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
      // Reference to avoid unused var lint errors while the workaround is active
      void _restoreFetch;

      // IMPORTANT for @openai/agents-realtime >=0.1.x: use Calls endpoint
      try {
        await session.connect({
          apiKey: clientToken,
          url: `https://api.openai.com/v1/realtime/calls?model=${CURRENT_MODEL_NAMES.OPENAI}`,
        });
        logger.debug("✅ Connected to OpenAI successfully");
      } catch (connectError) {
        logger.error("Error during session.connect():", connectError);
        throw connectError;
      } finally {
        try {
          _restoreFetch?.();
        } catch {}
      }

      // Session is now connected and audio will play through our audioElement
      setIsConnected(true);
      setIsConnecting(false);

      // Trigger the agent to start speaking immediately using sendMessage
      logger.debug("🎤 Triggering agent to start conversation...");
      try {
        // Send an empty message to trigger the agent to start the conversation
        await session.sendMessage("");
        logger.debug("✅ Agent conversation triggered");
      } catch (triggerErr) {
        logger.debug("⚠️ Failed to trigger agent start:", triggerErr);
      }

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
  }, [isConnecting, isConnected, disconnect, agent]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    connect,
    disconnect,
    error,
    audioRef,
  };
}
