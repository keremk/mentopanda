"use client";

import { useEffect, useState } from "react";
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(initialMinutes);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setDurationMinutes(initialMinutes);
  }, [initialMinutes]);

  useEffect(() => {
    if (isActive && !hasStarted && !isCompleted) {
      setTimeLeft(durationMinutes * 60);
      setHasStarted(true);
      setIsCompleted(false);
    } else if (!isActive) {
      setTimeLeft(0);
      setHasStarted(false);
      setIsCompleted(false);
    }
  }, [isActive, durationMinutes, hasStarted, isCompleted]);

  useEffect(() => {
    if (!isActive || !hasStarted || timeLeft <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          setIsCompleted(true);
          setTimeout(() => {
            onCountdownComplete();
          }, 50);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isActive, hasStarted, isCompleted, onCountdownComplete]);

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

  const displayMinutes = isActive ? Math.floor(timeLeft / 60) : durationMinutes;
  const displaySeconds = isActive ? timeLeft % 60 : 0;

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
