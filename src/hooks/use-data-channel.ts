import { useEffect } from "react";

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

export function useDataChannel(
  dataChannel: RTCDataChannel | null,
  onUserTranscript: (transcript: string) => void,
  onAgentTranscript: (transcript: string) => void
) {

  const setAudioTranscriptionModel = (model: string) => {
    if (!dataChannel) return;
    const updateEvent = {
      type: "session.update",
      session: {
        input_audio_transcription: { model },
      },
    };
    dataChannel.send(JSON.stringify(updateEvent));
  };

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
          onUserTranscript(data.transcript);
          break;
        
        case "response.audio_transcript.done":
          console.log("Agent Transcript:", data.transcript);
          onAgentTranscript(data.transcript);
          break;
      }
    } catch (error) {
      console.error("Failed to parse data channel message:", error);
    }
  };

  useEffect(() => {
    if (!dataChannel) return;

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

    return () => {
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [dataChannel, onUserTranscript, onAgentTranscript]);
}
