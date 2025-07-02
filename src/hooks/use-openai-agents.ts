import { useCallback, useRef, useState, useEffect } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
} from "@openai/agents/realtime";
import { getToken } from "@/app/actions/openai-agents";
import { logger } from "@/lib/logger";

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

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        // Clean up audio element
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.srcObject = null;
        }

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

    logger.info("RealtimeSession disconnected and cleaned up");
  }, []);

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

    try {
      logger.debug("🔑 Getting ephemeral token...");
      // Get ephemeral token from server
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

      // Create custom WebRTC transport with our audio element
      logger.debug("🌐 Creating WebRTC transport...");
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
        logger.error("RealtimeSession error:", error);
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

      // Listen for transport layer events if available
      if (session.transport) {
        session.transport.on("close", handleDisconnect);
        session.transport.on("error", handleError);

        session.transport.on("open", () => {
          logger.info("Transport layer connected");
        });
      }

      // Connect to OpenAI with the ephemeral token
      logger.debug("📞 Connecting to OpenAI...");
      await session.connect({ apiKey: clientToken });
      logger.debug("✅ Connected to OpenAI successfully");

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
