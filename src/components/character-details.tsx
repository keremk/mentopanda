"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle } from "lucide-react";
import type { CharacterDetails } from "@/data/characters";
import { VOICES, AI_MODELS } from "@/types/models";

type CharacterDetailsViewProps = {
  character: CharacterDetails;
};

export function CharacterDetailsView({ character }: CharacterDetailsViewProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [audio]);

  async function handlePlayVoice() {
    if (!character.voice) return;

    // If already playing, stop the audio
    if (isPlaying && audio) {
      audio.pause();
      audio.remove();
      setAudio(null);
      setIsPlaying(false);
      return;
    }

    // Find the voice in the VOICES array
    const aiModel = character.aiModel || AI_MODELS.OPENAI;
    const voiceData = VOICES[aiModel].find((v) => v.name === character.voice);

    if (!voiceData?.sampleUrl) return;

    try {
      setIsPlaying(true);
      const newAudio = new Audio(voiceData.sampleUrl);

      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudio(null);
      });

      newAudio.addEventListener("error", () => {
        console.error(`Error playing ${character.voice} sample`);
        setIsPlaying(false);
        setAudio(null);
      });

      setAudio(newAudio);
      await newAudio.play();
    } catch (error) {
      console.error(`Error playing ${character.voice} sample:`, error);
      setIsPlaying(false);
      setAudio(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={character.avatarUrl ?? undefined}
            alt={character.name}
          />
          <AvatarFallback className="text-2xl">
            {character.name[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">{character.name}</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!character.voice}
              onClick={handlePlayVoice}
            >
              {isPlaying ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isPlaying ? "Stop Voice" : "Play Voice"}
            </Button>
          </div>

          {character.description && (
            <p className="text-muted-foreground max-w-2xl">
              {character.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
