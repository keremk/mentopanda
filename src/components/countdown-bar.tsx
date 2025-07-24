"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/app/fonts.css";

type CountdownBarProps = {
  initialMinutes: number;
  maxDurationMinutes: number;
  onCountdownComplete: () => void;
  onDurationChange: (newDuration: number) => void;
  className?: string;
  isActive?: boolean;
};

export function CountdownBar({
  initialMinutes,
  maxDurationMinutes,
  onCountdownComplete,
  onDurationChange,
  className,
  isActive = false,
}: CountdownBarProps) {
  const [durationMinutes, setDurationMinutes] = useState(initialMinutes);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [, forceUpdate] = useState({});

  const stableOnCountdownComplete = useCallback(onCountdownComplete, [
    onCountdownComplete,
  ]);

  useEffect(() => {
    setDurationMinutes(initialMinutes);
  }, [initialMinutes]);

  useEffect(() => {
    if (isActive && !startTime && !isCompleted) {
      setStartTime(Date.now());
      setIsCompleted(false);
    } else if (!isActive) {
      setStartTime(null);
      setIsCompleted(false);
    }
  }, [isActive, startTime, isCompleted]);

  useEffect(() => {
    if (!isActive || !startTime || isCompleted) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;
      const totalSeconds = durationMinutes * 60;

      if (elapsedSeconds >= totalSeconds) {
        setIsCompleted(true);
        setTimeout(() => {
          stableOnCountdownComplete();
        }, 50);
      } else {
        // Force re-render to update display
        forceUpdate({});
      }
    }, 100); // Check every 100ms for smooth updates

    return () => clearInterval(timer);
  }, [
    isActive,
    startTime,
    isCompleted,
    durationMinutes,
    stableOnCountdownComplete,
  ]);

  const handleIncrement = () => {
    if (isActive) return;
    const newDuration = Math.min(durationMinutes + 1, maxDurationMinutes);
    setDurationMinutes(newDuration);
    onDurationChange(newDuration);
  };

  const handleDecrement = () => {
    if (isActive) return;
    const newDuration = Math.max(durationMinutes - 1, 1);
    setDurationMinutes(newDuration);
    onDurationChange(newDuration);
  };

  // Calculate remaining time based on actual system time
  const calculateTimeRemaining = () => {
    if (!isActive || !startTime) {
      return { minutes: durationMinutes, seconds: 0 };
    }

    const now = Date.now();
    const elapsedSeconds = (now - startTime) / 1000;
    const totalSeconds = durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    return {
      minutes: Math.floor(remainingSeconds / 60),
      seconds: Math.floor(remainingSeconds % 60),
    };
  };

  const { minutes: displayMinutes, seconds: displaySeconds } =
    calculateTimeRemaining();

  if (isCompleted && isActive) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-background border border-brand/20 rounded-md px-3 py-1 shadow-sm w-fit h-10",
        className
      )}
    >
      <Clock className="h-4 w-4 text-brand/60 mr-1" />
      <div className="font-['DS-Digital'] text-2xl tracking-wide leading-none w-20 text-center">
        <span className="text-brand">
          {displayMinutes.toString().padStart(2, "0")}
        </span>
        <span
          className={cn(
            "text-brand/80",
            isActive ? "animate-pulse" : "opacity-50"
          )}
        >
          :
        </span>
        <span className="text-brand">
          {displaySeconds.toString().padStart(2, "0")}
        </span>
        <span className="text-brand/60 text-xs ml-1.5 font-mono">
          MIN
        </span>
      </div>

      <div className="flex flex-col justify-center -space-y-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 text-brand/60 hover:text-brand disabled:opacity-30"
          onClick={handleIncrement}
          disabled={isActive || durationMinutes >= maxDurationMinutes}
          aria-label="Increase duration"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 text-brand/60 hover:text-brand disabled:opacity-30"
          onClick={handleDecrement}
          disabled={isActive || durationMinutes <= 1}
          aria-label="Decrease duration"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
