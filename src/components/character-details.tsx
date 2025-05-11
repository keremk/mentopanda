"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayCircle, StopCircle } from "lucide-react";
import type { CharacterDetails } from "@/data/characters";
import { VOICES, AI_MODELS } from "@/types/models";
import { getInitials } from "@/lib/utils";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

type CharacterDetailsViewProps = {
  character: CharacterDetails;
};

export function CharacterDetailsView({ character }: CharacterDetailsViewProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio && !isPlaying) {
      try {
        await audio.play();
        setIsPlaying(true);
        return;
      } catch (error) {
        console.error(`Error resuming ${character.voice} sample:`, error);
      }
    }

    const aiModel = character.aiModel || AI_MODELS.OPENAI;
    const voiceData = VOICES[aiModel]?.find((v) => v.name === character.voice);

    if (!voiceData?.sampleUrl) {
      console.warn(`No sample URL for voice: ${character.voice}`);
      return;
    }

    try {
      const newAudio = new Audio(voiceData.sampleUrl);
      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      newAudio.addEventListener("error", (e) => {
        console.error(`Error playing ${character.voice} sample:`, e);
        setIsPlaying(false);
        setAudio(null);
      });

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error(
        `Error initializing or playing ${character.voice} sample:`,
        error
      );
      setIsPlaying(false);
      setAudio(null);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="p-4 border rounded-lg cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center space-y-3 text-center h-full">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={character.avatarUrl ?? undefined}
              alt={character.name}
            />
            <AvatarFallback className="text-xl">
              {getInitials(character.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-md font-semibold mt-2">{character.name}</h3>
          <div className="mt-auto w-full pt-2">
            {" "}
            {/* This div will be pushed to the bottom */}
            <Button
              variant="ghost-brand"
              size="sm"
              className="gap-2"
              disabled={!character.voice}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayVoice();
              }}
            >
              {isPlaying ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isPlaying ? "Stop Voice" : "Play Voice"}
            </Button>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={character.avatarUrl ?? undefined}
                  alt={character.name}
                />
                <AvatarFallback>{getInitials(character.name)}</AvatarFallback>
              </Avatar>
              {character.name}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto prose dark:prose-invert">
          {character.description ? (
            <MemoizedMarkdown content={character.description} />
          ) : (
            <p className="text-muted-foreground">
              No description available for this character.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
