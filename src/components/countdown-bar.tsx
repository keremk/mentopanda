"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
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
        "flex items-center justify-center gap-3 bg-background border rounded-lg py-2 px-4 shadow-sm w-fit mx-auto",
        className
      )}
    >
      <div className="font-['DS-Digital'] text-4xl tracking-wider">
        <span className="text-primary">
          {displayMinutes.toString().padStart(2, "0")}
        </span>
        <span
          className={cn(
            "text-primary/80",
            isActive ? "animate-pulse" : "opacity-50"
          )}
        >
          :
        </span>
        <span className="text-primary">
          {displaySeconds.toString().padStart(2, "0")}
        </span>
        <span className="text-muted-foreground text-xs ml-2 font-mono align-baseline">
          MIN
        </span>
      </div>

      <div className="flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary disabled:opacity-30"
          onClick={handleIncrement}
          disabled={isActive || durationMinutes >= maxDurationMinutes}
          aria-label="Increase duration"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary disabled:opacity-30"
          onClick={handleDecrement}
          disabled={isActive || durationMinutes <= 1}
          aria-label="Decrease duration"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
