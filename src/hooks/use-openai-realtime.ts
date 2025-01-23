import { CURRENT_MODEL_NAMES } from "@/types/models";
import { getStoredApiKey } from "@/utils/apikey";
import { createOpenAISession } from "@/app/actions/openai-session";
import { useRef } from "react";

export type OpenAIRealtimeProps = {
  instructions: string;
  voice: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onTranscript: (transcript: string, role: "user" | "agent") => void;
  onRemoveLastTranscript: () => void;
};

type DataChannelMessage =
  | { type: "session.created" }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      transcript: string;
    }
  | {
      type: "response.audio_transcript.done";
      transcript: string;
    };

export function useOpenAIRealtime({
  instructions,
  voice,
  audioRef,
  onTranscript,
  onRemoveLastTranscript,
}: OpenAIRealtimeProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const providerUrl = "https://api.openai.com/v1/realtime";
  const model = CURRENT_MODEL_NAMES.OPENAI;

  const tokenFetcher = async () => {
    const storedApiKey = await getStoredApiKey();
    const { session } = await createOpenAISession({
      apiKey: storedApiKey || undefined,
      instructions: instructions,
      voice: voice,
    });
    return session.client_secret.value;
  };

  const sendClientEvent = (eventObj: any) => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(JSON.stringify(eventObj));
    } else {
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };

  const setAudioTranscriptionModel = (model: string) => {
    const updateEvent = {
      type: "session.update",
      session: {
        input_audio_transcription: { model },
      },
    };
    sendClientEvent(updateEvent);
  }

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as DataChannelMessage;
      console.log("Data Channel Message:", data);

      switch (data.type) {
        case "session.created":
          // For some reason, the model needs to be set after the session is created
          setAudioTranscriptionModel("whisper-1");
          break;

        case "conversation.item.input_audio_transcription.completed":
          console.log("Transcript:", data.transcript);
          onTranscript(data.transcript, "user");
          break;

        case "response.audio_transcript.done":
          console.log("Agent Transcript:", data.transcript);
          onTranscript(data.transcript, "agent");
          break;
      }
    } catch (error) {
      console.error("Failed to parse data channel message:", error);
    }
  };

  const registerHandlers = (dataChannel: RTCDataChannel) => {
    dataChannel.addEventListener("message", handleMessage);

    dataChannel.addEventListener("open", () => {
      console.log("Data channel opened");
    });

    dataChannel.addEventListener("close", () => {
      console.log("Data channel closed");
    });

    dataChannel.addEventListener("error", (error) => {
      console.error("Data channel error:", error);
    });
  };

  async function connect(localStream: MediaStream) {
    const ephemeralKey = await tokenFetcher();

    const connection = new RTCPeerConnection();
    peerConnectionRef.current = connection;

    // Setup remote audio playback
    const audioElement = audioRef.current;
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
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    dataChannelRef.current = null;
  }

  async function sendTextMessage(text: string) {
     sendClientEvent(
       {
         type: "conversation.item.create",
         item: {
           type: "message",
           role: "user",
           content: [{ type: "input_text", text: text.trim() }],
         },
       }
     );

    sendClientEvent({ type: "response.create" });
  }

  return { connect, disconnect, sendTextMessage };
}
