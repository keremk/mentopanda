import { useState, useCallback, useRef, useEffect } from "react";
import {
  RealtimeProvider,
  RealtimeConfig,
  RealtimeUsage,
  RealtimeError,
  ConnectionState,
  MessageItem,
} from "@/types/realtime";
import { 
  OpenAIRealtimeProvider, 
  useOpenAIRealtimeProvider 
} from "@/providers/openai-realtime-provider";
import { logger } from "@/lib/logger";

interface UseRealtimeReturn {
  connect: (stream: MediaStream) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: MessageItem) => Promise<void>;
  usage: RealtimeUsage | null;
  transcriptionModel: string | null;
  connectionState: ConnectionState;
  error: RealtimeError | null;
  refreshUsageData: () => { usage: RealtimeUsage | null; transcriptionModel: string | null };
}

export function useRealtime(config: RealtimeConfig): UseRealtimeReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('stopped');
  const [error, setError] = useState<RealtimeError | null>(null);
  const [usage, setUsage] = useState<RealtimeUsage | null>(null);
  const [transcriptionModel, setTranscriptionModel] = useState<string | null>(null);
  
  const providerRef = useRef<RealtimeProvider | null>(null);

  // Create the appropriate provider based on config
  const openAIProvider = useOpenAIRealtimeProvider({
    voice: config.voice,
    audioRef: config.audioRef,
    userName: config.userName,
  });

  const getProvider = useCallback((): RealtimeProvider => {
    if (!providerRef.current) {
      switch (config.provider) {
        case 'openai':
          providerRef.current = openAIProvider;
          break;
        case 'elevenlabs':
          throw new Error('ElevenLabs provider not yet implemented');
        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }
    }
    return providerRef.current;
  }, [config.provider, openAIProvider]);

  // Setup provider event listeners
  useEffect(() => {
    const provider = getProvider();
    
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    const handleError = (error: RealtimeError) => {
      setError(error);
    };

    provider.onStateChange(handleStateChange);
    provider.onError(handleError);

    // Cleanup function
    return () => {
      // Note: We don't have an unsubscribe mechanism in our interface yet
      // This could be added in a future iteration
    };
  }, [getProvider]);

  // Update usage and transcription model when connection state changes
  useEffect(() => {
    if (connectionState === 'stopped' && providerRef.current) {
      const currentUsage = providerRef.current.getUsage();
      if (currentUsage) {
        logger.info("useRealtime: Updating usage data on stop", currentUsage);
        setUsage(currentUsage);
      }
      const currentTranscriptionModel = providerRef.current.getTranscriptionModel?.();
      if (currentTranscriptionModel) {
        logger.info("useRealtime: Updating transcription model on stop", currentTranscriptionModel);
        setTranscriptionModel(currentTranscriptionModel);
      }
    }
  }, [connectionState]);

  // Function to refresh usage data manually
  const refreshUsageData = useCallback(() => {
    if (providerRef.current) {
      const currentUsage = providerRef.current.getUsage();
      const currentTranscriptionModel = providerRef.current.getTranscriptionModel?.();
      
      logger.info("useRealtime: Manually refreshing usage data", { 
        currentUsage, 
        currentTranscriptionModel 
      });
      
      if (currentUsage) {
        setUsage(currentUsage);
      }
      if (currentTranscriptionModel) {
        setTranscriptionModel(currentTranscriptionModel);
      }
      
      return { usage: currentUsage, transcriptionModel: currentTranscriptionModel || null };
    }
    return { usage: null, transcriptionModel: null };
  }, []);

  const connect = useCallback(async (stream: MediaStream) => {
    setError(null);
    const provider = getProvider();
    await provider.connect(stream);
  }, [getProvider]);

  const disconnect = useCallback(async () => {
    const provider = getProvider();
    await provider.disconnect();
    // Update usage and transcription model one final time
    const finalUsage = provider.getUsage();
    if (finalUsage) {
      setUsage(finalUsage);
    }
    const finalTranscriptionModel = provider.getTranscriptionModel?.();
    if (finalTranscriptionModel) {
      setTranscriptionModel(finalTranscriptionModel);
    }
  }, [getProvider]);

  const sendMessage = useCallback(async (message: MessageItem) => {
    const provider = getProvider();
    await provider.sendMessage(message);
  }, [getProvider]);

  return {
    connect,
    disconnect,
    sendMessage,
    usage,
    transcriptionModel,
    connectionState,
    error,
    refreshUsageData,
  };
}

// Backward compatibility helper that maintains the same API as useOpenAIRealtime
export function useOpenAIRealtimeCompat({
  instructions,
  voice,
  audioRef,
  userName,
  agentName,
}: {
  instructions: string;
  voice: string;
  audioRef: React.RefObject<HTMLAudioElement> | null;
  userName: string;
  agentName: string;
}) {
  const config: RealtimeConfig = {
    provider: 'openai',
    voice: {
      instructions,
      voice,
      displayName: agentName,
    },
    audioRef: audioRef!,
    userName,
  };

  const { connect, disconnect, sendMessage, usage } = useRealtime(config);

  // Wrapper for sendMessage to match original API
  const sendTextMessage = useCallback(async (text: string) => {
    const message: MessageItem = {
      type: 'user',
      content: text,
      timestamp: Date.now(),
    };
    await sendMessage(message);
  }, [sendMessage]);

  return {
    connect,
    disconnect,
    sendTextMessage,
    usage,
    transcriptionModel: null, // This would need to be implemented in the provider interface
  };
}