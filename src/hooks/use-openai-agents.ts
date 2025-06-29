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

export function useOpenAIAgents(agentConfig: {
  name: string;
  instructions: string;
}): UseOpenAIAgentsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize agent
  useEffect(() => {
    if (!agentRef.current) {
      agentRef.current = new RealtimeAgent({
        name: agentConfig.name,
        instructions: agentConfig.instructions,
      });
    }
  }, [agentConfig.name, agentConfig.instructions]);

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
      // Get ephemeral token from server
      const clientToken = await getToken();

      if (!agentRef.current) {
        throw new Error("Agent not initialized");
      }

      if (!audioRef.current) {
        throw new Error("Audio element not available");
      }

      // Create custom WebRTC transport with our audio element
      const customTransport = new OpenAIRealtimeWebRTC({
        audioElement: audioRef.current,
      });

      // Create session with the custom transport
      const session = new RealtimeSession(agentRef.current, {
        transport: customTransport,
      });
      sessionRef.current = session;

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
      await session.connect({ apiKey: clientToken });

      // Session is now connected and audio will play through our audioElement
      setIsConnected(true);
      setIsConnecting(false);

      logger.info(
        "RealtimeSession connected successfully with custom audio element"
      );
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
  }, [isConnecting, isConnected, disconnect]);

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
