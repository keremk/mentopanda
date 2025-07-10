"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { logger } from "@/lib/logger";

interface WindowWithAudioContext extends Window {
  webkitAudioContext: typeof AudioContext;
}

interface SpeakingBubbleProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  avatarUrl?: string;
  /**
   * Controls visibility of the avatar. When false the avatar will be hidden and will
   * animate into view once switched to true.
   * Defaults to true for backward-compatibility.
   */
  showAvatar?: boolean;
}

export function SpeakingBubble({
  audioRef,
  isPlaying,
  avatarUrl,
  showAvatar = true,
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
  const isPlayingRef = useRef(isPlaying);
  const prevStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const fullyTearDown = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    isAnalyzingRef.current = false;
    isPlayingRef.current = false;

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        /* safari sometimes throws if already closed */
      });
      audioContextRef.current = null;
    }

    prevStreamRef.current = null;
  }, []);

  const stopAnalyzing = useCallback(() => {
    isAnalyzingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    fullyTearDown();
  }, [fullyTearDown]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isAnalyzingRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = isNaN(average)
      ? 0
      : Math.max(0, Math.min(1, average / 255));
    setAudioLevel(normalizedLevel);

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

    const frequencies = Array.from(dataArray).slice(0, 64);
    setFrequencyData(
      frequencies.map((f) => {
        const normalized = f / 255;
        return isNaN(normalized) ? 0 : Math.max(0, Math.min(1, normalized));
      })
    );

    setAnimationTime(Date.now() * 0.003);

    if (isAnalyzingRef.current && isMountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  const simulateIdlePattern = useCallback(() => {
    // Stop idle animation only if playing or analyzing audio
    if (isPlayingRef.current || isAnalyzingRef.current) return;

    const time = Date.now() * 0.002;
    setAnimationTime(time);

    const breathingPattern = 0.3 + Math.sin(time) * 0.2;
    const secondaryWave = 0.2 + Math.sin(time * 1.3) * 0.15;

    setAudioLevel(breathingPattern);
    setLowFreq(breathingPattern);
    setMidFreq(secondaryWave);

    const simulatedFreqs = Array.from({ length: 64 }, (_, i) => {
      return 0.1 + Math.sin(time + i * 0.3) * 0.2 + Math.random() * 0.1;
    });
    setFrequencyData(simulatedFreqs);

    // Continue animation as long as not playing/analyzing
    if (!isPlayingRef.current && !isAnalyzingRef.current) {
      animationFrameRef.current = requestAnimationFrame(simulateIdlePattern);
    }
  }, []);

  const startAnalyzing = useCallback(async () => {
    if (!audioRef.current) return;

    const stream = audioRef.current.srcObject;
    if (!(stream instanceof MediaStream)) return; // nothing to analyse yet

    if (isAnalyzingRef.current && stream === prevStreamRef.current) return;

    fullyTearDown();

    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as WindowWithAudioContext).webkitAudioContext)();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      source.connect(analyser);

      prevStreamRef.current = stream;
      isAnalyzingRef.current = true;
      analyzeAudio();
    } catch (error) {
      logger.error("SpeakingBubble: Error setting up audio analysis:", error);
    }
  }, [audioRef, analyzeAudio, fullyTearDown]);

  useEffect(() => {
    if (isPlaying) {
      startAnalyzing();
    } else {
      stopAnalyzing();
      // Always restart idle pattern when not playing
      simulateIdlePattern();
    }
  }, [isPlaying, startAnalyzing, stopAnalyzing, simulateIdlePattern]);

  /*
   * Extra safety: drive analyser setup / teardown directly from <audio> element
   * events so we always react to the real playback lifecycle, regardless of
   * parent-state quirks.
   */
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handlePlay = () => {
      startAnalyzing();
    };

    const handlePauseOrEnded = () => {
      stopAnalyzing();
      simulateIdlePattern();
    };

    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePauseOrEnded);
    audioEl.addEventListener("ended", handlePauseOrEnded);
    audioEl.addEventListener("emptied", handlePauseOrEnded); // fires when srcObject is cleared

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePauseOrEnded);
      audioEl.removeEventListener("ended", handlePauseOrEnded);
      audioEl.removeEventListener("emptied", handlePauseOrEnded);
    };
  }, [audioRef, startAnalyzing, stopAnalyzing, simulateIdlePattern]);

  // Critical cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fullyTearDown();
    };
  }, [fullyTearDown]);

  // Start idle animation on mount
  useEffect(() => {
    // Start the breathing animation immediately when component mounts
    if (!isPlayingRef.current && !isAnalyzingRef.current) {
      simulateIdlePattern();
    }
  }, [simulateIdlePattern]);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      <div className="relative w-72 h-72 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(circle at ${30 + lowFreq * 40}% ${40 + Math.sin(animationTime + lowFreq * 10) * 30}%, 
                rgba(255, 255, 255, ${0.3 + lowFreq * 0.4}) 0%, 
                transparent 50%)`,
              transform: `rotate(${animationTime * 20 + lowFreq * 180}deg) scale(${1 + lowFreq * 0.5})`,
            }}
          />
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
          <div
            className="absolute inset-4 opacity-40"
            style={{
              background: `radial-gradient(ellipse ${40 + audioLevel * 60}% ${60 + audioLevel * 40}% at ${40 + Math.sin(animationTime * 0.7) * 30}% ${60 + Math.cos(animationTime * 0.5) * 30}%, 
                rgba(236, 72, 153, ${0.5 + audioLevel * 0.5}) 0%, 
                transparent 70%)`,
              transform: `rotate(${animationTime * -30 + audioLevel * 90}deg)`,
            }}
          />
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
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 backdrop-blur-sm"
            style={{
              width: `${20 + audioLevel * 40}px`,
              height: `${20 + audioLevel * 40}px`,
              boxShadow: `0 0 ${audioLevel * 30}px rgba(255, 255, 255, ${audioLevel})`,
            }}
          />
        </div>
        <div
          className="absolute top-1/2 left-1/2 rounded-full overflow-hidden border-2 border-white/40 shadow-lg z-10"
          /* Animated appearance of avatar */
          style={{
            width: "140px",
            height: "140px",
            transform: `translate(-50%, -50%) scale(${showAvatar ? 1 : 0.2})`,
            opacity: showAvatar ? 1 : 0,
            transition:
              "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-out",
          }}
        >
          <Image
            src={avatarUrl || "/placeholder-training.svg"}
            alt="AI Assistant"
            fill
            className="object-cover"
          />
        </div>
      </div>
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-xl -z-10"
        style={{
          transform: `scale(${1.1 + audioLevel * 0.2})`,
        }}
      />
    </div>
  );
}
