"use client";

import { SpeakingBubble } from "@/components/speaking-bubble";
import { AgentActions } from "@/components/agent-actions";
import { useRef } from "react";

const AVATAR_URL =
  "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars//gopanda.png";

export function MentorAgent() {
  // In the future this audio element will stream mentor speech.
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <SpeakingBubble
        audioRef={audioRef}
        isPlaying={false}
        avatarUrl={AVATAR_URL}
      />
      <AgentActions />
      {/* Hidden audio element reserved for future real-time playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
