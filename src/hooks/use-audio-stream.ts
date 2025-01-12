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
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

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
    // dataChannel.addEventListener("message", (e) => {
    //   console.log("Data Channel Message:", e.data);
    // });

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

  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    dataChannelRef.current = null;
  };

  return {
    connect,
    disconnect,
    dataChannel: dataChannelRef.current,
  };
}
