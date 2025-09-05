import { CURRENT_MODEL_NAMES } from "@/types/models";
import { createOpenAISession } from "@/app/actions/openai-session";
import { useRef, useCallback } from "react";
import { useTranscript } from "@/contexts/transcript";
import { useApiKey } from "@/hooks/use-api-key";
import { logger } from "@/lib/logger";
import {
  RealtimeProvider,
  RealtimeUsage,
  RealtimeError,
  ConnectionState,
  MessageItem,
  VoicePrompt,
} from "@/types/realtime";

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
    output?: Array<{
      id?: string;
      object?: string;
      type?: string;
      status?: string;
      name?: string;
      call_id?: string;
      arguments?: string;
    }>;
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

interface OpenAIRealtimeProviderProps {
  voice: VoicePrompt;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  userName: string;
}

export class OpenAIRealtimeProvider implements RealtimeProvider {
  private peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
  private dataChannelRef: React.MutableRefObject<RTCDataChannel | null>;
  private providerUrl = "https://api.openai.com/v1/realtime";
  private model = CURRENT_MODEL_NAMES.OPENAI;
  private usage: RealtimeUsage | null = null;
  private transcriptionModel: string | null = null;
  private stateChangeCallback: ((state: ConnectionState) => void) | null = null;
  private errorCallback: ((error: RealtimeError) => void) | null = null;
  private currentState: ConnectionState = 'stopped';

  // Function calling support
  private toolFunctions: Record<string, (args: unknown) => Promise<unknown>> = {};
  private tools: unknown[] = [];

  // React context dependencies
  private transcriptContext: ReturnType<typeof useTranscript>;
  private apiKey: string | null;

  constructor(
    props: OpenAIRealtimeProviderProps,
    transcriptContext: ReturnType<typeof useTranscript>,
    apiKey: string | null | undefined
  ) {
    this.voice = props.voice;
    this.audioRef = props.audioRef;
    this.userName = props.userName;
    this.transcriptContext = transcriptContext;
    this.apiKey = apiKey || null;
    
    this.peerConnectionRef = { current: null };
    this.dataChannelRef = { current: null };

    // Store tools and their implementations
    if (this.voice.tools) {
      this.tools = this.voice.tools;
    }
    if (this.voice.toolFunctions) {
      // Cast to the expected type since VoicePrompt allows Function but we need async functions
      this.toolFunctions = this.voice.toolFunctions as Record<string, (args: unknown) => Promise<unknown>>;
    }
  }

  private voice: VoicePrompt;
  private audioRef: React.RefObject<HTMLAudioElement | null>;
  private userName: string;

  private setState(newState: ConnectionState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.stateChangeCallback?.(newState);
    }
  }

  private emitError(type: RealtimeError['type'], message: string, originalError?: Error) {
    const error: RealtimeError = { type, message, originalError };
    this.errorCallback?.(error);
  }

  onStateChange(callback: (state: ConnectionState) => void): void {
    this.stateChangeCallback = callback;
  }

  onError(callback: (error: RealtimeError) => void): void {
    this.errorCallback = callback;
  }

  getUsage(): RealtimeUsage | null {
    return this.usage;
  }

  getTranscriptionModel(): string | null {
    return this.transcriptionModel;
  }

  private async tokenFetcher(): Promise<string> {
    try {
      const { session, transcriptionModel } = await createOpenAISession({
        apiKey: this.apiKey || undefined,
        instructions: this.voice.instructions,
        voice: this.voice.voice,
        forceEnglishTranscription: true,
      });

      this.transcriptionModel = transcriptionModel;
      return session.client_secret.value;
    } catch (error) {
      if (error instanceof Error && error.message === "No credits available") {
        this.emitError('credits', "No credits available", error);
        throw new Error("No credits available");
      }
      this.emitError('session', "Failed to create session", error as Error);
      throw error;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private sendClientEvent(eventObj: any) {
    if (
      this.dataChannelRef.current &&
      this.dataChannelRef.current.readyState === "open"
    ) {
      this.dataChannelRef.current.send(JSON.stringify(eventObj));
    } else {
      logger.error(
        "Failed to send message - no data channel available",
        eventObj
      );
      this.emitError('connection', 'No data channel available');
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  private updateSession() {
    this.sendClientEvent({ type: "input_audio_buffer.clear" });

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
        instructions: this.voice.instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: turnDetection,
        tools: this.tools,
        tool_choice: "auto",
      },
    };

    logger.info("🛠️ Updating session with tools:", { 
      toolCount: this.tools.length, 
      tools: this.tools,
      toolFunctions: Object.keys(this.toolFunctions)
    });

    this.sendClientEvent(updateEvent);
  }

  private async cancelAssistantSpeech() {
    const mostRecentAgentMessage = [...this.transcriptContext.transcriptEntries]
      .reverse()
      .find((entry) => entry.role === "agent");

    if (!mostRecentAgentMessage) {
      logger.warn("can't cancel, no recent assistant message found");
      return;
    }
    if (mostRecentAgentMessage.status === "DONE") {
      return;
    }

    this.sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAgentMessage?.id,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAgentMessage.createdAtMs,
    });
    this.sendClientEvent({ type: "response.cancel" });
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const serverEvent = JSON.parse(event.data) as ServerEvent;

      switch (serverEvent.type) {
        case "session.created":
          this.setState('connected');
          this.updateSession();
          break;

        case "conversation.item.created": {
          let text =
            serverEvent.item?.content?.[0]?.text ||
            serverEvent.item?.content?.[0]?.transcript ||
            "";

          const role = serverEvent.item?.role === "user" ? "user" : "agent";
          const entryId = serverEvent.item?.id;
          const name = role === "user" ? this.userName : this.voice.displayName;
          
          if (
            entryId &&
            this.transcriptContext.transcriptEntries.some((entry) => entry.id === entryId)
          ) {
            break;
          }

          if (entryId) {
            if (role === "user" && !text) {
              text = "[Transcribing...]";
            }
            this.transcriptContext.addTranscriptMessage(entryId, name, role, text);
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
            this.transcriptContext.updateTranscriptMessage(entryId, finalTranscript, false);
          }
          break;
        }

        case "response.audio_transcript.delta": {
          const entryId = serverEvent.item_id;
          const deltaText = serverEvent.delta || "";
          if (entryId) {
            this.transcriptContext.updateTranscriptMessage(entryId, deltaText, true);
          }
          break;
        }

        case "response.audio_transcript.done": {
          const entryId = serverEvent.item_id;
          const finalTranscript = serverEvent.transcript || "";
          if (entryId) {
            this.transcriptContext.updateTranscriptMessage(entryId, finalTranscript, false);
          }
          break;
        }

        case "response.output_item.done": {
          const entryId = serverEvent.item?.id;
          if (entryId) {
            this.transcriptContext.updateTranscriptEntryStatus(entryId, "DONE");
          }
          break;
        }

        case "response.done": {
          const usageData = serverEvent.response?.usage;
          if (usageData) {
            logger.info("State:", serverEvent.response?.status);
            logger.info("Token Usage:", usageData);
            this.usage = {
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
            };
          }

          // Check if response contains function calls
          const output = serverEvent.response?.output;
          if (output && output.length > 0) {
            logger.info("📦 Response output received:", output);
            for (const item of output) {
              if (item.type === "function_call") {
                logger.info("🔧 Function call detected:", { name: item.name, call_id: item.call_id });
                // Execute function call without await since this method is not async
                this.executeFunctionCall(item).catch((error) => {
                  logger.error("Failed to execute function call:", error);
                });
              }
            }
          }
          break;
        }
      }
    } catch (error) {
      logger.error("Failed to parse data channel message:", error);
      this.emitError('connection', 'Failed to parse server message', error as Error);
    }
  };

  private registerHandlers(dataChannel: RTCDataChannel) {
    dataChannel.addEventListener("message", this.handleMessage);

    dataChannel.addEventListener("error", (error) => {
      logger.error("Data channel error:", error);
      this.emitError('connection', 'Data channel error');
    });
  }

  async connect(localStream: MediaStream): Promise<void> {
    try {
      this.setState('starting');
      
      const ephemeralKey = await this.tokenFetcher();

      const connection = new RTCPeerConnection();
      this.peerConnectionRef.current = connection;

      // Setup remote audio playback
      const audioElement = this.audioRef?.current;
      if (audioElement) {
        audioElement.autoplay = true;
        connection.ontrack = (event) => {
          audioElement.srcObject = event.streams[0];
          this.setState('started');
        };
      }

      // Create and store the data channel reference
      const dataChannel = connection.createDataChannel("provider-data");
      this.dataChannelRef.current = dataChannel;
      this.registerHandlers(dataChannel);

      // Add the local microphone tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          connection.addTrack(track, localStream);
        });
      }

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      const response = await fetch(`${this.providerUrl}?model=${this.model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const answerSDP = await response.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSDP,
      };
      await connection.setRemoteDescription(answer);
    } catch (error) {
      this.setState('stopped');
      this.emitError('connection', 'Failed to connect', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.peerConnectionRef.current) {
      this.peerConnectionRef.current.close();
      this.peerConnectionRef.current = null;
    }
    if (this.audioRef && this.audioRef.current) {
      this.audioRef.current.srcObject = null;
    }
    this.dataChannelRef.current = null;
    this.setState('stopped');
  }

  async sendMessage(message: MessageItem): Promise<void> {
    await this.cancelAssistantSpeech();

    this.sendClientEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: message.content.trim() }],
      },
    });

    this.sendClientEvent({ type: "response.create" });
  }

  // Function execution methods
  private async executeFunctionCall(functionCallItem: {
    name?: string;
    call_id?: string;
    arguments?: string;
  }) {
    const { name, call_id, arguments: argsString } = functionCallItem;
    
    logger.info("🚀 Starting function call execution:", { name, call_id, arguments: argsString });
    
    if (!name || !call_id || !argsString) {
      logger.error("❌ Invalid function call item", functionCallItem);
      return;
    }

    try {
      // 1. Parse arguments from JSON string
      logger.info("🔍 Parsing arguments:", argsString);
      const args = this.parseArguments(argsString);
      logger.info("✅ Arguments parsed:", args);
      
      // 2. Find and execute the function
      logger.info("🎯 Executing function:", name);
      const result = await this.executeFunction(name, args);
      logger.info("✅ Function execution result:", result);
      
      // 3. Send results back to the model
      logger.info("📤 Sending function result back to model");
      await this.sendFunctionResult(call_id, result);
      
      // 4. Trigger response creation to continue conversation
      logger.info("🔄 Triggering response creation");
      this.sendClientEvent({ type: "response.create" });
      
    } catch (error) {
      logger.error(`❌ Function execution failed for ${name}:`, error);
      await this.sendFunctionError(call_id, error as Error);
      this.sendClientEvent({ type: "response.create" });
    }
  }

  private parseArguments(argsString: string): unknown {
    try {
      return JSON.parse(argsString);
    } catch (error) {
      logger.error("Failed to parse function arguments:", { argsString, error });
      throw new Error(`Invalid JSON arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeFunction(functionName: string, args: unknown): Promise<unknown> {
    const functionImpl = this.toolFunctions[functionName];
    
    if (!functionImpl) {
      throw new Error(`Function '${functionName}' not found in toolFunctions`);
    }
    
    if (typeof functionImpl !== 'function') {
      throw new Error(`'${functionName}' is not a function`);
    }
    
    try {
      // Execute the function with parsed arguments
      // The function can be sync or async, we await regardless
      const result = await functionImpl(args);
      return result;
    } catch (error) {
      logger.error(`Function '${functionName}' execution failed:`, error);
      throw error;
    }
  }

  private async sendFunctionResult(callId: string, result: unknown) {
    // Convert result to JSON string for the API
    const resultString = JSON.stringify(result);
    
    const functionResultEvent = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: resultString
      }
    };
    
    this.sendClientEvent(functionResultEvent);
  }

  private async sendFunctionError(callId: string, error: Error) {
    const errorResult = {
      success: false,
      error: error.message
    };
    
    await this.sendFunctionResult(callId, errorResult);
  }
}

// Hook wrapper to maintain compatibility with React patterns
export function useOpenAIRealtimeProvider(props: OpenAIRealtimeProviderProps) {
  const transcriptContext = useTranscript();
  const { apiKey } = useApiKey();
  
  const providerRef = useRef<OpenAIRealtimeProvider | null>(null);
  
  const getProvider = useCallback(() => {
    if (!providerRef.current) {
      providerRef.current = new OpenAIRealtimeProvider(
        props,
        transcriptContext,
        apiKey
      );
    }
    return providerRef.current;
  }, [props, transcriptContext, apiKey]);

  return getProvider();
}