"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, ChevronDownIcon, CheckIcon, PauseIcon } from "lucide-react";
import { AIModel, VOICES } from "@/types/models";
import * as Portal from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";

interface CharacterVoiceSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  aiModel: AIModel;
}

export function CharacterVoiceSelect({
  value,
  onValueChange,
  aiModel,
}: CharacterVoiceSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentlyPlayingVoice, setCurrentlyPlayingVoice] = React.useState<
    string | null
  >(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

  // Update dropdown position when trigger button moves
  React.useEffect(() => {
    if (!triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Cleanup audio on unmount
  React.useEffect(() => {
    const audioToCleanUp = audio;
    return () => {
      if (audioToCleanUp) {
        audioToCleanUp.pause();
      }
    };
  }, [audio]);

  // Close dropdown on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".voice-dropdown")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handlePlayVoice(sampleUrl: string | null, voiceName: string) {
    if (!sampleUrl) return;

    if (isPlaying && currentlyPlayingVoice === voiceName) {
      // If the same voice is playing, pause it
      audio?.pause();
      setIsPlaying(false);
      setCurrentlyPlayingVoice(null);
      return;
    }

    try {
      const newAudio = new Audio(sampleUrl);

      const onEnded = () => {
        setAudio((currentAudioInState) => {
          if (currentAudioInState === newAudio) {
            setIsPlaying(false);
            setCurrentlyPlayingVoice(null);
            return null;
          }
          return currentAudioInState;
        });
        newAudio.removeEventListener("ended", onEnded);
        newAudio.removeEventListener("error", onError);
      };

      const onError = () => {
        console.error(`Error playing ${voiceName} sample for ${newAudio.src}`);
        setAudio((currentAudioInState) => {
          if (currentAudioInState === newAudio) {
            setIsPlaying(false);
            setCurrentlyPlayingVoice(null);
            return null;
          }
          return currentAudioInState;
        });
        newAudio.removeEventListener("ended", onEnded);
        newAudio.removeEventListener("error", onError);
      };

      newAudio.addEventListener("ended", onEnded);
      newAudio.addEventListener("error", onError);

      setAudio(newAudio);
      setIsPlaying(true);
      setCurrentlyPlayingVoice(voiceName);

      await newAudio.play();
    } catch (error) {
      console.error(
        `Error initiating playback for ${voiceName} sample:`,
        error
      );
      setIsPlaying(false);
      setCurrentlyPlayingVoice(null);
      setAudio((currentAudioInState) =>
        currentAudioInState && currentAudioInState.src === sampleUrl
          ? null
          : currentAudioInState
      );
    }
  }

  const voices = VOICES[aiModel];
  const selectedVoice = voices.find((v) => v.name === value);

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between text-base rounded-2xl "
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedVoice?.name || "Select a voice"}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <Portal.Root>
          <div
            className="voice-dropdown fixed z-50 min-w-[8rem] overflow-hidden border bg-popover text-popover-foreground shadow-md outline-none animate-in rounded-2xl ring-2 ring-brand"
            style={{
              top: `${position.top + 4}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            <div className="max-h-[300px] overflow-auto py-1">
              {voices.map((voice) => (
                <div
                  key={voice.name}
                  className={cn(
                    "relative flex items-center px-8 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    voice.name === value && "bg-accent/50"
                  )}
                  onClick={() => {
                    onValueChange?.(voice.name);
                    setIsOpen(false);
                  }}
                >
                  <div className="absolute left-2 w-4 flex items-center justify-center">
                    {voice.name === value && <CheckIcon className="h-4 w-4" />}
                  </div>
                  <span className="flex-grow truncate">{voice.name}</span>
                  {voice.sampleUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-accent-foreground/10 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVoice(voice.sampleUrl, voice.name);
                      }}
                    >
                      {isPlaying && currentlyPlayingVoice === voice.name ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isPlaying && currentlyPlayingVoice === voice.name
                          ? `Pause ${voice.name} sample`
                          : `Play ${voice.name} sample`}
                      </span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
