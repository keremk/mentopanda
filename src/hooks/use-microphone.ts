import { useState, useRef } from "react";

export function useMicrophone() {
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const startMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneStreamRef.current = stream;
    return stream;
  };

  const stopMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
  };

  const muteMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
      setIsMuted(true);
    }
  };

  const unmuteMicrophone = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = true));
      setIsMuted(false);
    }
  };

  return {
    startMicrophone,
    stopMicrophone,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
    microphoneStream: microphoneStreamRef.current,
  };
}
