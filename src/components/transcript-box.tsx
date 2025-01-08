"use client";

import { useEffect, useRef } from "react";

export function TranscriptBox({ text }: { text: string }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [text]);

  return (
    <div className="relative w-full h-14 flex items-center justify-center">
      <div
        ref={scrollContainerRef}
        className="fixed-size w-full max-w-[600px] h-12 overflow-x-auto whitespace-nowrap 
          bg-background/50 backdrop-blur-sm border rounded-xl flex items-center px-6
          shadow-sm transition-all duration-200
          scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          hover:bg-background/60"
      >
        <div ref={textRef} className="flex-shrink-0 w-fit text-foreground/80">
          {text || "Waiting to start conversation..."}
        </div>
      </div>
    </div>
  );
}
