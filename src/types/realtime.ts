export type ConnectionState = 'stopped' | 'connecting' | 'connected';

export interface RealtimeUsage {
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
}

export interface TranscriptionUsage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  inputTokenDetails: {
    textTokens: number;
    audioTokens: number;
  };
}

export interface RealtimeError {
  type: 'connection' | 'audio' | 'session' | 'credits' | 'unknown';
  message: string;
  originalError?: Error;
}

export interface MessageItem {
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface VoicePrompt {
  instructions: string;
  voice: string;
  displayName: string;
  tools?: ToolDefinition[];
  toolFunctions?: Record<string, (args: unknown) => Promise<unknown>>;
}

export interface RealtimeConfig {
  provider: 'openai' | 'elevenlabs'; // extensible for future
  voice: VoicePrompt;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  userName: string;
  enableTranscription?: boolean;
  enableUsageTracking?: boolean;
}

export interface RealtimeProvider {
  connect(stream: MediaStream): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: MessageItem): Promise<void>;
  getUsage(): RealtimeUsage | null;
  getTranscriptionUsage?(): TranscriptionUsage | null;
  getTranscriptionModel?(): string | null;
  onStateChange(callback: (state: ConnectionState) => void): void;
  onError(callback: (error: RealtimeError) => void): void;
}