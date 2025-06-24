"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface WindowWithAudioContext extends Window {
  webkitAudioContext: typeof AudioContext;
}

interface SpeakingBubbleProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  avatarUrl?: string;
}

export function SpeakingBubble({
  audioRef,
  isPlaying,
  avatarUrl,
}: SpeakingBubbleProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [lowFreq, setLowFreq] = useState(0);
  const [midFreq, setMidFreq] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      startAnalyzing();
    } else {
      stopAnalyzing();
      if (!isPlaying) {
        simulateIdlePattern();
      }
    }

    return () => {
      cleanup();
    };
  }, [isPlaying]);

  // Start idle simulation on mount
  useEffect(() => {
    if (!isPlaying) {
      simulateIdlePattern();
    }

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    isAnalyzingRef.current = false;

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
  };

  const startAnalyzing = async () => {
    if (!audioRef.current || isAnalyzingRef.current) return;

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as WindowWithAudioContext).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Always recreate the source and analyser to ensure fresh connections
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }

      let source: AudioNode;
      const stream = audioRef.current.srcObject;

      // Use MediaStreamSource if a stream is available, otherwise fall back to MediaElementSource
      if (stream instanceof MediaStream) {
        console.log("SpeakingBubble: Creating source from MediaStream.");
        source = audioContext.createMediaStreamSource(stream);
      } else {
        console.log("SpeakingBubble: Creating source from MediaElement.");
        source = audioContext.createMediaElementSource(audioRef.current);
      }
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      sourceRef.current.connect(analyserRef.current);
      // Do not connect analyser to destination to avoid echo/double audio.

      isAnalyzingRef.current = true;
      console.log("SpeakingBubble: Audio analysis started successfully.");
      analyzeAudio();
    } catch (error) {
      console.error("SpeakingBubble: Error setting up audio analysis:", error);
      // Fall back to simulation if real audio analysis fails
      simulateRealisticAudio();
    }
  };

  const stopAnalyzing = () => {
    isAnalyzingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    // Disconnect and clear refs to force re-creation on next play
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !isAnalyzingRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate overall audio level with validation
    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = isNaN(average)
      ? 0
      : Math.max(0, Math.min(1, average / 255));
    setAudioLevel(normalizedLevel);

    // Split into frequency bands for different pattern effects
    const lowEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.4);

    const lowFreqData = dataArray.slice(0, lowEnd);
    const midFreqData = dataArray.slice(lowEnd, midEnd);

    const lowAvg =
      lowFreqData.reduce((sum, val) => sum + val, 0) / lowFreqData.length / 255;
    const midAvg =
      midFreqData.reduce((sum, val) => sum + val, 0) / midFreqData.length / 255;

    setLowFreq(isNaN(lowAvg) ? 0 : Math.max(0, Math.min(1, lowAvg)));
    setMidFreq(isNaN(midAvg) ? 0 : Math.max(0, Math.min(1, midAvg)));

    // Get detailed frequency data for patterns with validation
    const frequencies = Array.from(dataArray).slice(0, 64);
    setFrequencyData(
      frequencies.map((f) => {
        const normalized = f / 255;
        return isNaN(normalized) ? 0 : Math.max(0, Math.min(1, normalized));
      })
    );

    if (isAnalyzingRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  };

  const simulateIdlePattern = () => {
    if (isPlaying || isAnalyzingRef.current) return; // Stop simulation if audio starts playing

    const time = Date.now() * 0.002;
    setAnimationTime(time);

    // Create gentle, breathing-like patterns
    const breathingPattern = 0.3 + Math.sin(time) * 0.2;
    const secondaryWave = 0.2 + Math.sin(time * 1.3) * 0.15;

    setAudioLevel(breathingPattern);
    setLowFreq(breathingPattern);
    setMidFreq(secondaryWave);

    // Generate simulated frequency data
    const simulatedFreqs = Array.from({ length: 64 }, (_, i) => {
      return 0.1 + Math.sin(time + i * 0.3) * 0.2 + Math.random() * 0.1;
    });
    setFrequencyData(simulatedFreqs);

    if (!isPlaying && !isAnalyzingRef.current) {
      animationFrameRef.current = requestAnimationFrame(simulateIdlePattern);
    }
  };

  const simulateRealisticAudio = () => {
    if (!isPlaying) return;

    const time = Date.now() * 0.003;
    setAnimationTime(time);

    // Simulate realistic voice patterns with more variation
    const baseLevel =
      0.4 + Math.sin(time * 2) * 0.3 + Math.sin(time * 3.7) * 0.2;
    const spikes = Math.random() > 0.6 ? Math.random() * 0.5 : 0;
    const level = Math.max(0, Math.min(1, baseLevel + spikes));

    setAudioLevel(level);
    setLowFreq(0.3 + Math.sin(time * 1.2) * 0.4);
    setMidFreq(0.2 + Math.sin(time * 2.1) * 0.3);

    // Generate more dynamic frequency data
    const frequencies = Array.from({ length: 64 }, (_, i) => {
      const freq =
        0.2 + Math.sin(time * 2 + i * 0.4) * 0.4 + Math.random() * 0.3 * level;
      return Math.max(0, Math.min(1, freq));
    });
    setFrequencyData(frequencies);

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(simulateRealisticAudio);
    }
  };

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Main bubble container */}
      <div className="relative w-72 h-72 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 shadow-2xl overflow-hidden">
        {/* Flowing abstract patterns inside the bubble */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Base flowing pattern - low frequencies */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(circle at ${30 + lowFreq * 40}% ${40 + Math.sin(animationTime + lowFreq * 10) * 30}%, 
                rgba(255, 255, 255, ${0.3 + lowFreq * 0.4}) 0%, 
                transparent 50%)`,
              transform: `rotate(${animationTime * 20 + lowFreq * 180}deg) scale(${1 + lowFreq * 0.5})`,
            }}
          />

          {/* Mid frequency waves */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `conic-gradient(from ${animationTime * 50 + midFreq * 360}deg at ${50 + Math.cos(animationTime) * 20}% ${50 + Math.sin(animationTime * 1.3) * 20}%, 
                rgba(147, 51, 234, ${0.4 + midFreq * 0.6}) 0deg, 
                transparent 60deg, 
                rgba(59, 130, 246, ${0.3 + midFreq * 0.5}) 120deg, 
                transparent 180deg)`,
              transform: `scale(${1 + midFreq * 0.8})`,
            }}
          />

          {/* High frequency sparkles */}
          {frequencyData.slice(32, 48).map((freq, i) => {
            const safeFreq = isNaN(freq) ? 0 : freq;
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${2 + safeFreq * 8}px`,
                  height: `${2 + safeFreq * 8}px`,
                  left: `${20 + (i * 60) / 16 + Math.sin(animationTime * 2 + i) * 20}%`,
                  top: `${20 + (i * 60) / 16 + Math.cos(animationTime * 1.5 + i) * 20}%`,
                  opacity: Math.max(0, Math.min(1, safeFreq * 0.8)),
                  transform: `scale(${0.5 + safeFreq * 1.5})`,
                  boxShadow: `0 0 ${safeFreq * 10}px rgba(255, 255, 255, ${Math.max(0, Math.min(1, safeFreq))})`,
                }}
              />
            );
          })}

          {/* Organic flowing shapes */}
          <div
            className="absolute inset-4 opacity-40"
            style={{
              background: `radial-gradient(ellipse ${40 + audioLevel * 60}% ${60 + audioLevel * 40}% at ${40 + Math.sin(animationTime * 0.7) * 30}% ${60 + Math.cos(animationTime * 0.5) * 30}%, 
                rgba(236, 72, 153, ${0.5 + audioLevel * 0.5}) 0%, 
                transparent 70%)`,
              transform: `rotate(${animationTime * -30 + audioLevel * 90}deg)`,
            }}
          />

          {/* Frequency-based ripples */}
          {[...Array(6)].map((_, i) => {
            const freqValue = frequencyData[i * 8] || 0;
            const safeFreq = isNaN(freqValue) ? 0 : freqValue;
            return (
              <div
                key={i}
                className="absolute rounded-full border-2 border-white/30"
                style={{
                  width: `${50 + safeFreq * 150}px`,
                  height: `${50 + safeFreq * 150}px`,
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) scale(${0.3 + safeFreq * 1.2})`,
                  opacity: Math.max(0, Math.min(1, safeFreq * 0.6)),
                  borderColor: `hsl(${(animationTime * 50 + i * 60) % 360}, 70%, 80%)`,
                }}
              />
            );
          })}

          {/* Central energy core */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 backdrop-blur-sm"
            style={{
              width: `${20 + audioLevel * 40}px`,
              height: `${20 + audioLevel * 40}px`,
              boxShadow: `0 0 ${audioLevel * 30}px rgba(255, 255, 255, ${audioLevel})`,
            }}
          />
        </div>

        {/* Avatar positioned concentrically in the center */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden border-2 border-white/40 shadow-lg z-10"
          style={{ width: "140px", height: "140px" }}
        >
          <Image
            src={avatarUrl || "/placeholder-training.svg"}
            alt="AI Assistant"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Subtle outer glow for the bubble only */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-xl -z-10"
        style={{
          transform: `scale(${1.1 + audioLevel * 0.2})`,
        }}
      />
    </div>
  );
}
