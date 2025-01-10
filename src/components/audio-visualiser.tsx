// AudioVisualiser.tsx
import React, { useEffect, useState, RefObject } from "react";

interface AudioSetup {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
}

export interface ExtendedHTMLAudioElement extends HTMLAudioElement {
  __audioSetup?: AudioSetup;
}

interface AudioVisualiserProps {
  audioRef: RefObject<HTMLAudioElement>;
}

function AudioVisualiser({ audioRef }: AudioVisualiserProps) {
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    const audioElement = audioRef.current as ExtendedHTMLAudioElement | null;
    if (!audioElement) {
      console.log("Analyser: audioRef.current is not set yet.");
      return;
    }
    console.log("Analyser: audioRef.current is set");

    let audioContext: AudioContext;
    let mediaSource: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;

    const setupAnalyser = async () => {
      if (!audioElement) {
        console.log("Analyser: audioElement is null");
        return;
      }

      const stream = audioElement.srcObject as MediaStream | null;
      if (!stream) {
        console.warn("No MediaStream found on audio element.");
        return;
      }

      audioContext = new AudioContext();
      await audioContext.resume();

      mediaSource = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Smaller FFT size for more rapid updates
      analyser.smoothingTimeConstant = 0.1; // Reduced smoothing for more dynamic response
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      mediaSource.connect(analyser);

      const update = () => {
        if (!analyser) {
          console.log("Analyser: analyser is null");
          return;
        }
        analyser.getFloatTimeDomainData(dataArray);

        // Find the peak amplitude in this frame
        let maxAmplitude = 0;
        for (let i = 0; i < bufferLength; i++) {
          const absolute = Math.abs(dataArray[i]);
          if (absolute > maxAmplitude) {
            maxAmplitude = absolute;
          }
        }

        // Scale the amplitude non-linearly
        const scaledAmplitude = Math.pow(maxAmplitude, 0.7) * 2;
        setAmplitude(scaledAmplitude);

        animationFrameId = requestAnimationFrame(update);
      };

      update();
    };

    // If the audio element is already playing, set up the analyser immediately.
    // Otherwise, wait for the 'play' event to set it up.
    if (!audioElement.paused) {
      console.log("Analyser: Audio element is already playing");
      setupAnalyser();
    } else {
      const onPlay = () => {
        setupAnalyser();
        audioElement.removeEventListener("play", onPlay);
      };
      audioElement.addEventListener("play", onPlay);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (analyser) analyser.disconnect();
      // if (mediaSource) mediaSource.disconnect();
      // We don't disconnect the mediaSource or close the context here
      // because they may be used by other components or reused.
    };
  }, [audioRef]);

  const barWidthPercentage = Math.min(100, amplitude * 100) / 2;
  const numberOfSegments = 12;
  const activeSegments = Math.ceil(
    (barWidthPercentage / 100) * numberOfSegments
  );

  // Create array of segments
  const segments = Array.from({ length: numberOfSegments }, (_, i) => i);

  return (
    <div className="w-full h-1.5 flex justify-center items-center gap-[2px]">
      {/* Left bar */}
      <div className="w-[50%] h-full flex justify-end gap-[1px]">
        {segments.reverse().map((i) => (
          <div
            key={`left-${i}`}
            className={`h-full w-full max-w-[8px] rounded-full transition-all duration-75
              ${i < activeSegments ? "bg-primary/70" : "bg-secondary/30"}`}
          />
        ))}
      </div>

      {/* Right bar */}
      <div className="w-[50%] h-full flex justify-start gap-[1px]">
        {[...segments].reverse().map((i) => (
          <div
            key={`right-${i}`}
            className={`h-full w-full max-w-[8px] rounded-full transition-all duration-75
              ${i < activeSegments ? "bg-primary/70" : "bg-secondary/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default AudioVisualiser;
