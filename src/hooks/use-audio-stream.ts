import { useRef } from "react";

export type AudioStreamProps = {
  model: string;
  providerUrl: string;
  tokenFetcher: () => Promise<string>;
  audioRef: React.RefObject<HTMLAudioElement>;
};

export function useAudioStream({
  model,
  providerUrl,
  tokenFetcher,
  audioRef,
}: AudioStreamProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  async function connect(localStream: MediaStream) {
    // Fetch the ephemeral key using the provided tokenFetcher
    const ephemeralKey = await tokenFetcher();

    // Create and configure the RTCPeerConnection
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

    // Establish a data channel for additional communication if needed
    const dataChannel = connection.createDataChannel("provider-data");
    dataChannel.addEventListener("message", (e) => {
      console.log("Data Channel Message:", e.data);
    });

    // Add the local microphone tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });
    }

    // Create an SDP offer and exchange with the provider's API
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
  }

  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  };

  return { connect, disconnect };
}
