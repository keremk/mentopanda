import { useState, useCallback, useRef, useEffect } from "react";
import {
  RealtimeProvider,
  RealtimeConfig,
  RealtimeUsage,
  TranscriptionUsage,
  RealtimeError,
  ConnectionState,
  MessageItem,
} from "@/types/realtime";
import { 
  useOpenAIRealtimeProvider 
} from "@/providers/openai-realtime-provider";
import { logger } from "@/lib/logger";

interface UseRealtimeReturn {
  connect: (stream: MediaStream) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: MessageItem) => Promise<void>;
  usage: RealtimeUsage | null;
  transcriptionUsage: TranscriptionUsage | null;
  transcriptionModel: string | null;
  connectionState: ConnectionState;
  error: RealtimeError | null;
  refreshUsageData: () => { usage: RealtimeUsage | null; transcriptionUsage: TranscriptionUsage | null; transcriptionModel: string | null };
}

export function useRealtime(config: RealtimeConfig): UseRealtimeReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('stopped');
  const [error, setError] = useState<RealtimeError | null>(null);
  const [usage, setUsage] = useState<RealtimeUsage | null>(null);
  const [transcriptionUsage, setTranscriptionUsage] = useState<TranscriptionUsage | null>(null);
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
      const currentTranscriptionUsage = providerRef.current.getTranscriptionUsage?.();
      if (currentTranscriptionUsage) {
        logger.info("useRealtime: Updating transcription usage on stop", currentTranscriptionUsage);
        setTranscriptionUsage(currentTranscriptionUsage);
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
      const currentTranscriptionUsage = providerRef.current.getTranscriptionUsage?.();
      const currentTranscriptionModel = providerRef.current.getTranscriptionModel?.();
      
      logger.info("useRealtime: Manually refreshing usage data", { 
        currentUsage, 
        currentTranscriptionUsage,
        currentTranscriptionModel 
      });
      
      if (currentUsage) {
        setUsage(currentUsage);
      }
      if (currentTranscriptionUsage) {
        setTranscriptionUsage(currentTranscriptionUsage);
      }
      if (currentTranscriptionModel) {
        setTranscriptionModel(currentTranscriptionModel);
      }
      
      return { usage: currentUsage, transcriptionUsage: currentTranscriptionUsage || null, transcriptionModel: currentTranscriptionModel || null };
    }
    return { usage: null, transcriptionUsage: null, transcriptionModel: null };
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
    const finalTranscriptionUsage = provider.getTranscriptionUsage?.();
    if (finalTranscriptionUsage) {
      setTranscriptionUsage(finalTranscriptionUsage);
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
    transcriptionUsage,
    transcriptionModel,
    connectionState,
    error,
    refreshUsageData,
  };
}
