import { MODEL_NAMES } from "@/types/models";
import { createOpenAISession } from "@/app/actions/openai-session";
import { useRef, useCallback, useMemo } from "react";
import { useTranscript } from "@/contexts/transcript";
import { useApiKey } from "@/hooks/use-api-key";
import { logger } from "@/lib/logger";
import {
  RealtimeProvider,
  RealtimeUsage,
  TranscriptionUsage,
  RealtimeError,
  ConnectionState,
  MessageItem,
  VoicePrompt,
  ToolDefinition,
} from "@/types/realtime";

type TranscriptionConfig = {
  model: string;
  language?: string;
  prompt?: string;
};

type TurnDetection = {
  type: "server_vad" | "semantic_vad";
  eagerness?: "auto" | "low" | "high";
  threshold?: number;
  prefix_padding_ms?: number;
  silence_duration_ms?: number;
  idle_timeout_ms?: number;
  create_response?: boolean;
  interrupt_response?: boolean;
};

type NoiseReduction = {
  type: "near_field" | "far_field";
};

type AudioFormat = {
  type: string;
  rate?: number;
};

type AudioInput = {
  format?: AudioFormat;
  transcription?: TranscriptionConfig | null;
  noise_reduction?: NoiseReduction | null;
  turn_detection?: TurnDetection | null;
};

type AudioOutput = {
  format?: AudioFormat;
  speed?: number;
  voice?: string;
};

type PromptReference = {
  id: string;
  variables?: unknown;
  version?: string | null;
};

type RealtimeSession = {
  type: string;
  model: string;
  audio?: {
    input?: AudioInput;
    output?: AudioOutput;
  };
  instructions?: string;
  max_output_tokens?: number | "inf";
  output_modalities?: string[];
  prompt?: PromptReference | null;
  tools?: ToolDefinition[];
  tool_choice?: string;
};

type UpdateSessionEvent = {
  type: "session.update";
  event_id?: string;
  timestamp?: string;
  session: RealtimeSession;
};

type OpenAIRealtimeUsage = {
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

type OpenAITranscriptionUsage = {
  type: "tokens";
  total_tokens: number;
  input_tokens: number;
  input_token_details: {
    text_tokens: number;
    audio_tokens: number;
  };
  output_tokens: number;
};

interface OpenAIRealtimeProviderProps {
  voice: VoicePrompt;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  userName: string;
}

export function useOpenAIRealtimeProvider(
  props: OpenAIRealtimeProviderProps
): RealtimeProvider {
  const transcriptContext = useTranscript();
  const { apiKey } = useApiKey();

  const voice = props.voice;
  const audioRef = props.audioRef;
  const userName = props.userName;
  const resolvedApiKey = apiKey || null;

  // Helper function to accumulate usage data across multiple response.done events
  const accumulateRealtimeUsage = useCallback((newUsageData: OpenAIRealtimeUsage) => {
    const currentUsage = usageRef.current;
    
    if (!currentUsage) {
      // First usage data - initialize
      usageRef.current = {
        totalTokens: newUsageData.total_tokens,
        inputTokens: newUsageData.input_tokens,
        outputTokens: newUsageData.output_tokens,
        inputTokenDetails: {
          cachedTokens: newUsageData.input_token_details.cached_tokens,
          textTokens: newUsageData.input_token_details.text_tokens,
          audioTokens: newUsageData.input_token_details.audio_tokens,
          cachedTokensDetails: {
            textTokens: newUsageData.input_token_details.cached_tokens_details.text_tokens,
            audioTokens: newUsageData.input_token_details.cached_tokens_details.audio_tokens,
          },
        },
        outputTokenDetails: {
          textTokens: newUsageData.output_token_details.text_tokens,
          audioTokens: newUsageData.output_token_details.audio_tokens,
        },
      };
    } else {
      // Accumulate with existing usage data
      usageRef.current = {
        totalTokens: currentUsage.totalTokens + newUsageData.total_tokens,
        inputTokens: currentUsage.inputTokens + newUsageData.input_tokens,
        outputTokens: currentUsage.outputTokens + newUsageData.output_tokens,
        inputTokenDetails: {
          cachedTokens: currentUsage.inputTokenDetails.cachedTokens + newUsageData.input_token_details.cached_tokens,
          textTokens: currentUsage.inputTokenDetails.textTokens + newUsageData.input_token_details.text_tokens,
          audioTokens: currentUsage.inputTokenDetails.audioTokens + newUsageData.input_token_details.audio_tokens,
          cachedTokensDetails: {
            textTokens: currentUsage.inputTokenDetails.cachedTokensDetails.textTokens + newUsageData.input_token_details.cached_tokens_details.text_tokens,
            audioTokens: currentUsage.inputTokenDetails.cachedTokensDetails.audioTokens + newUsageData.input_token_details.cached_tokens_details.audio_tokens,
          },
        },
        outputTokenDetails: {
          textTokens: currentUsage.outputTokenDetails.textTokens + newUsageData.output_token_details.text_tokens,
          audioTokens: currentUsage.outputTokenDetails.audioTokens + newUsageData.output_token_details.audio_tokens,
        },
      };
    }
  }, []);

  // Helper function to accumulate transcription usage data
  const accumulateTranscriptionUsage = useCallback((newTranscriptionUsage: OpenAITranscriptionUsage) => {
    const currentUsage = transcriptionUsageRef.current;
    
    if (!currentUsage) {
      // First transcription usage data - initialize
      transcriptionUsageRef.current = {
        totalTokens: newTranscriptionUsage.total_tokens,
        inputTokens: newTranscriptionUsage.input_tokens,
        outputTokens: newTranscriptionUsage.output_tokens,
        inputTokenDetails: {
          textTokens: newTranscriptionUsage.input_token_details.text_tokens,
          audioTokens: newTranscriptionUsage.input_token_details.audio_tokens,
        },
      };
    } else {
      // Accumulate transcription usage with existing data
      transcriptionUsageRef.current = {
        totalTokens: currentUsage.totalTokens + newTranscriptionUsage.total_tokens,
        inputTokens: currentUsage.inputTokens + newTranscriptionUsage.input_tokens,
        outputTokens: currentUsage.outputTokens + newTranscriptionUsage.output_tokens,
        inputTokenDetails: {
          textTokens: currentUsage.inputTokenDetails.textTokens + newTranscriptionUsage.input_token_details.text_tokens,
          audioTokens: currentUsage.inputTokenDetails.audioTokens + newTranscriptionUsage.input_token_details.audio_tokens,
        },
      };
    }
  }, []);

  // State management with refs for persistence
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const usageRef = useRef<RealtimeUsage | null>(null);
  const transcriptionUsageRef = useRef<TranscriptionUsage | null>(null);
  const transcriptionModelRef = useRef<string | null>(null);
  const stateChangeCallbackRef = useRef<
    ((state: ConnectionState) => void) | null
  >(null);
  const errorCallbackRef = useRef<((error: RealtimeError) => void) | null>(
    null
  );
  const currentStateRef = useRef<ConnectionState>("stopped");

  // Constants
  const providerUrl = "https://api.openai.com/v1/realtime/calls";
  const model = MODEL_NAMES.OPENAI_REALTIME;

  // Function calling support - memoized to prevent dependency issues
  const toolFunctions = useMemo(
    () =>
      voice.toolFunctions
        ? (voice.toolFunctions as Record<
            string,
            (args: unknown) => Promise<unknown>
          >)
        : {},
    [voice.toolFunctions]
  );
  const tools = useMemo(() => voice.tools || [], [voice.tools]);

  const setState = useCallback((newState: ConnectionState) => {
    if (currentStateRef.current !== newState) {
      currentStateRef.current = newState;
      stateChangeCallbackRef.current?.(newState);
    }
  }, []);

  const emitError = useCallback(
    (type: RealtimeError["type"], message: string, originalError?: Error) => {
      const error: RealtimeError = { type, message, originalError };
      errorCallbackRef.current?.(error);
    },
    []
  );

  const onStateChange = useCallback(
    (callback: (state: ConnectionState) => void): void => {
      stateChangeCallbackRef.current = callback;
    },
    []
  );

  const onError = useCallback(
    (callback: (error: RealtimeError) => void): void => {
      errorCallbackRef.current = callback;
    },
    []
  );

  const getUsage = useCallback((): RealtimeUsage | null => {
    return usageRef.current;
  }, []);

  const getTranscriptionUsage = useCallback((): TranscriptionUsage | null => {
    return transcriptionUsageRef.current;
  }, []);

  const getTranscriptionModel = useCallback((): string | null => {
    return transcriptionModelRef.current;
  }, []);

  const tokenFetcher = useCallback(async (): Promise<string> => {
    try {
      const { ephemeralToken } = await createOpenAISession({
        apiKey: resolvedApiKey || undefined,
        voice: voice.voice,
      });

      return ephemeralToken;
    } catch (error) {
      if (error instanceof Error && error.message === "No credits available") {
        emitError("credits", "No credits available", error);
        throw new Error("No credits available");
      }
      emitError("session", "Failed to create session", error as Error);
      throw error;
    }
  }, [resolvedApiKey, voice.instructions, voice.voice, emitError]);

  const sendClientEvent = useCallback(
    (eventObj: unknown) => {
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
        emitError("connection", "No data channel available");
      }
    },
    [emitError]
  );

  const updateSession = useCallback(() => {
    sendClientEvent({ type: "input_audio_buffer.clear" });

    const turnDetection: TurnDetection = {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200,
      create_response: true,
    };

    // const turnDetection: TurnDetection = {
    //   type: "semantic_vad",
    //   eagerness: "low",
    //   create_response: true,
    // };
    const transcription: TranscriptionConfig = {
      model: MODEL_NAMES.OPENAI_TRANSCRIBE,
      language: "en",
    };

    transcriptionModelRef.current = transcription.model;

    const audio: AudioInput = {
      noise_reduction: { type: "far_field" },
      transcription,
      turn_detection: turnDetection,
    };

    const session: RealtimeSession = {
      type: "realtime",
      model: MODEL_NAMES.OPENAI_REALTIME,
      instructions: voice.instructions,
      output_modalities: ["audio"],
      audio: { input: audio },
      tools,
      tool_choice: "auto",
    };

    const updateEvent: UpdateSessionEvent = {
      type: "session.update",
      session,
    };

    logger.info("🛠️ Updating session with tools:", {
      toolCount: tools.length,
      tools: tools,
      toolFunctions: Object.keys(toolFunctions),
    });

    sendClientEvent(updateEvent);
  }, [sendClientEvent, voice.instructions, tools, toolFunctions]);

  const cancelAssistantSpeech = useCallback(async () => {
    const mostRecentAgentMessage = [...transcriptContext.transcriptEntries]
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
  }, [transcriptContext.transcriptEntries, sendClientEvent]);

  // Forward declarations for functions that reference each other
  const executeFunctionCall = useCallback(
    async (functionCallItem: {
      name?: string;
      call_id?: string;
      arguments?: string;
    }) => {
      const { name, call_id, arguments: argsString } = functionCallItem;

      logger.info("🚀 Starting function call execution:", {
        name,
        call_id,
        arguments: argsString,
      });

      if (!name || !call_id || !argsString) {
        logger.error("❌ Invalid function call item", functionCallItem);
        return;
      }

      try {
        // 1. Parse arguments from JSON string
        logger.info("🔍 Parsing arguments:", argsString);
        const args = parseArguments(argsString);
        logger.info("✅ Arguments parsed:", args);

        // 2. Find and execute the function
        logger.info("🎯 Executing function:", name);
        const result = await executeFunction(name, args);
        logger.info("✅ Function execution result:", result);

        // 3. Send results back to the model
        logger.info("📤 Sending function result back to model");
        await sendFunctionResult(call_id, result);

        // 4. Trigger response creation to continue conversation
        logger.info("🔄 Triggering response creation");
        sendClientEvent({ type: "response.create" });
      } catch (error) {
        logger.error(`❌ Function execution failed for ${name}:`, error);
        await sendFunctionError(call_id, error as Error);
        sendClientEvent({ type: "response.create" });
      }
    },
    [sendClientEvent]
  ); // parseArguments, executeFunction, sendFunctionResult, sendFunctionError are stable functions

  const parseArguments = useCallback((argsString: string): unknown => {
    try {
      return JSON.parse(argsString);
    } catch (error) {
      logger.error("Failed to parse function arguments:", {
        argsString,
        error,
      });
      throw new Error(
        `Invalid JSON arguments: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }, []);

  const executeFunction = useCallback(
    async (functionName: string, args: unknown): Promise<unknown> => {
      const functionImpl = toolFunctions[functionName];

      if (!functionImpl) {
        throw new Error(
          `Function '${functionName}' not found in toolFunctions`
        );
      }

      if (typeof functionImpl !== "function") {
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
    },
    [toolFunctions]
  );

  const sendFunctionResult = useCallback(
    async (callId: string, result: unknown) => {
      // Convert result to JSON string for the API
      const resultString = JSON.stringify(result);

      const functionResultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: resultString,
        },
      };

      sendClientEvent(functionResultEvent);
    },
    [sendClientEvent]
  );

  const sendFunctionError = useCallback(
    async (callId: string, error: Error) => {
      const errorResult = {
        success: false,
        error: error.message,
      };

      await sendFunctionResult(callId, errorResult);
    },
    [sendFunctionResult]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const serverEvent = JSON.parse(event.data);
        logger.debug(`Server Event: ${JSON.stringify(serverEvent)}`);

        switch (serverEvent.type) {
          case "session.created":
            setState("connected");
            updateSession();
            break;

          case "session.updated":
            logger.debug(`Session Updated ${JSON.stringify(serverEvent)}`);
            break;
          
          case "conversation.item.added": {
            const isUser = serverEvent.item?.role === "user"
            if (isUser) {
              // We should create an entry that marks the start of transcription
              transcriptContext.addTranscriptMessage(
                serverEvent.item?.id,
                voice.displayName, 
                "user",
                "Transcribing ..."
              )
            }
            break;
          }

          case "response.output_item.added": {
            const text =
              serverEvent.item?.content?.[0]?.text ||
              serverEvent.item?.content?.[0]?.transcript ||
              "";

            const entryId = serverEvent.item?.id;
            if (
              entryId &&
              transcriptContext.transcriptEntries.some(
                (entry) => entry.id === entryId
              )
            ) {
              break;
            }

            if (entryId) {
              transcriptContext.addTranscriptMessage(
                entryId,
                userName,
                "agent",
                text
              );
            }
            break;
          }

          case "conversation.item.input_audio_transcription.completed": {
            const entryId = serverEvent.item_id;
            const finalTranscript =
              !serverEvent.transcript || serverEvent.transcript === "\n"
                ? "[inaudible]"
                : serverEvent.transcript;
            
            // Track transcription token usage
            const transcriptionUsage = serverEvent.usage;
            if (transcriptionUsage) {
              logger.info("Transcription Usage:", transcriptionUsage);
              accumulateTranscriptionUsage(transcriptionUsage);
            }
            
            if (entryId) {
              logger.debug(
                `[input_audio_transcription.completed] Updating transcript for entry ${entryId}: "${finalTranscript}"`
              );
              transcriptContext.updateTranscriptMessage(
                entryId,
                finalTranscript,
                false
              );
              
            }
            break;
          }

          case "response.output_audio_transcript.delta": {
            const entryId = serverEvent.item_id;
            const deltaText = serverEvent.delta || "";
            if (entryId) {
              // logger.debug(
              //   `[output_audio_transcript.delta] Appending delta for entry ${entryId}: "${deltaText}"`
              // );
              transcriptContext.updateTranscriptMessage(
                entryId,
                deltaText,
                true
              );
            }
            break;
          }

          case "response.output_audio_transcript.done": {
            const entryId = serverEvent.item_id;
            const finalTranscript = serverEvent.transcript || "";
            if (entryId) {
              logger.debug(
                `[output_audio_transcript.done] Final transcript for entry ${entryId}: "${finalTranscript}"`
              );
              transcriptContext.updateTranscriptMessage(
                entryId,
                finalTranscript,
                false
              );
            }
            break;
          }

          case "response.output_item.done": {
            const entryId = serverEvent.item?.id;
            if (entryId) {
              transcriptContext.updateTranscriptEntryStatus(entryId, "DONE");
            }
            break;
          }

          case "response.done": {
            const usageData = serverEvent.response?.usage;
            if (usageData) {
              logger.info("State:", serverEvent.response?.status);
              logger.info("Token Usage:", usageData);
              accumulateRealtimeUsage(usageData);
            }

            // Check if response contains function calls
            const output = serverEvent.response?.output;
            if (output && output.length > 0) {
              logger.info("📦 Response output received:", output);
              for (const item of output) {
                if (item.type === "function_call") {
                  logger.info("🔧 Function call detected:", {
                    name: item.name,
                    call_id: item.call_id,
                  });
                  // Execute function call without await since this method is not async
                  executeFunctionCall(item).catch((error) => {
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
        emitError(
          "connection",
          "Failed to parse server message",
          error as Error
        );
      }
    },
    [
      setState,
      updateSession,
      userName,
      voice.displayName,
      transcriptContext,
      emitError,
      executeFunctionCall,
      accumulateRealtimeUsage,
      accumulateTranscriptionUsage,
    ]
  );

  const registerHandlers = useCallback(
    (dataChannel: RTCDataChannel) => {
      dataChannel.addEventListener("message", handleMessage);

      dataChannel.addEventListener("error", (error) => {
        logger.error("Data channel error:", error);
        emitError("connection", "Data channel error");
      });
    },
    [handleMessage, emitError]
  );

  const connect = useCallback(
    async (localStream: MediaStream): Promise<void> => {
      try {
        setState("starting");

        const ephemeralKey = await tokenFetcher();

        const connection = new RTCPeerConnection();
        peerConnectionRef.current = connection;

        // Setup remote audio playback
        const audioElement = audioRef?.current;
        if (audioElement) {
          audioElement.autoplay = true;
          connection.ontrack = (event) => {
            audioElement.srcObject = event.streams[0];
            setState("started");
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
        setState("stopped");
        emitError("connection", "Failed to connect", error as Error);
        throw error;
      }
    },
    [
      setState,
      tokenFetcher,
      audioRef,
      registerHandlers,
      providerUrl,
      model,
      emitError,
    ]
  );

  const disconnect = useCallback(async (): Promise<void> => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef && audioRef.current) {
      audioRef.current.srcObject = null;
    }
    dataChannelRef.current = null;
    setState("stopped");
  }, [audioRef, setState]);

  const sendMessage = useCallback(
    async (message: MessageItem): Promise<void> => {
      await cancelAssistantSpeech();

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: message.content.trim() }],
        },
      });

      sendClientEvent({ type: "response.create" });
    },
    [cancelAssistantSpeech, sendClientEvent]
  );

  // Return the provider object implementing the RealtimeProvider interface
  return {
    connect,
    disconnect,
    sendMessage,
    getUsage,
    getTranscriptionUsage,
    getTranscriptionModel,
    onStateChange,
    onError,
  };
}
