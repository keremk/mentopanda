"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import "@/app/fonts.css";

type CountdownBarProps = {
  initialMinutes: number;
  onCountdownComplete: () => void;
  className?: string;
  isActive?: boolean;
};

export function CountdownBar({
  initialMinutes,
  onCountdownComplete,
  className,
  isActive = false,
}: CountdownBarProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset timer when isActive changes
  useEffect(() => {
    if (isActive && !hasStarted && !isCompleted) {
      setTimeLeft(initialMinutes * 60);
      setHasStarted(true);
    } else if (!isActive) {
      setTimeLeft(0);
      setHasStarted(false);
      setIsCompleted(false);
    }
  }, [isActive, initialMinutes, hasStarted, isCompleted]);

  // Handle countdown
  useEffect(() => {
    if (!isActive || !hasStarted || timeLeft <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime === 0) {
          setIsCompleted(true);
          // Use setTimeout to ensure state updates are completed
          setTimeout(() => {
            onCountdownComplete();
          }, 0);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onCountdownComplete, isActive, hasStarted, isCompleted]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isCompleted) return null;

  return (
    <div
      className={cn(
        "bg-background border rounded-lg py-2 px-4 text-center w-fit mx-auto shadow-sm",
        className
      )}
    >
      <div className="font-['DS-Digital'] text-4xl tracking-wider">
        <span className="text-primary">
          {minutes.toString().padStart(2, "0")}
        </span>
        <span className="text-primary/80 animate-pulse">:</span>
        <span className="text-primary">
          {seconds.toString().padStart(2, "0")}
        </span>
        <span className="text-muted-foreground text-xs ml-2 font-mono">
          MIN
        </span>
      </div>
    </div>
  );
}
