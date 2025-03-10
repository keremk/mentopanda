"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CharacterSummary } from "@/data/characters";
import { Module } from "@/data/modules";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { useCharacterPrompt } from "@/contexts/character-prompt-context";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

type Props = {
  module: Module;
};

export function EditModuleCharacter({ module }: Props) {
  const { toast } = useToast();
  const { selectedModule } = useModuleEdit();
  const {
    characterPrompt,
    updateCharacterPrompt,
    selectCharacter,
    characters,
    initializeCharacter,
  } = useCharacterPrompt();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!module) return;

    // Get the first character if available
    const character =
      module.modulePrompt.characters.length > 0
        ? module.modulePrompt.characters[0]
        : null;

    initializeCharacter(character);
  }, [module.modulePrompt.characters, initializeCharacter]);
  /* eslint-enable react-hooks/exhaustive-deps */
  

  const handleCharacterPromptChange = (value: string) => {
    if (!selectedModule?.modulePrompt.characters.length) return;
    updateCharacterPrompt(value);
  };

  const handleCharacterChange = async (value: string) => {
    if (!selectedModule || !value) return;

    const newCharacterId = parseInt(value);

    try {
      await selectCharacter(newCharacterId);
    } catch (error) {
      console.error("Error selecting character:", error);
      toast({
        title: "Error selecting character",
        description: "Please try again",
      });
    }
  };

  if (!selectedModule) return null;

  // Get current character ID or null
  const currentCharacterId =
    selectedModule.modulePrompt.characters.length > 0
      ? selectedModule.modulePrompt.characters[0].id.toString()
      : null;

  return (
    <div className="space-y-6">
      <div className="border border-border/50 rounded-lg p-5 bg-secondary/10 shadow-sm">
        <div className="flex gap-3">
          <Select
            value={currentCharacterId || ""}
            onValueChange={handleCharacterChange}
          >
            <SelectTrigger className="w-full bg-background/90 border-border/50">
              <SelectValue placeholder="Assign Character">
                {currentCharacterId && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6 border border-border/30">
                      <AvatarImage
                        src={
                          selectedModule.modulePrompt.characters[0].avatarUrl ||
                          undefined
                        }
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(
                          selectedModule.modulePrompt.characters[0].name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {selectedModule.modulePrompt.characters[0].name}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-border/50 bg-background/95 backdrop-blur-sm">
              {characters.map((character: CharacterSummary) => (
                <SelectItem
                  key={character.id}
                  value={character.id.toString()}
                  className="flex items-center space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6 border border-border/30">
                      <AvatarImage src={character.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(character.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{character.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            asChild
            className="border-border/50 hover:bg-secondary/50 shadow-sm"
          >
            <Link href="/characters">Manage</Link>
          </Button>
        </div>
      </div>

      {selectedModule.modulePrompt.characters.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block text-foreground/90">
            Character Prompt
          </label>
          <Textarea
            value={characterPrompt}
            onChange={(e) => handleCharacterPromptChange(e.target.value)}
            placeholder="Enter the character's prompt..."
            rows={10}
            className="border-border/50 bg-background/80 focus-visible:ring-primary/20 resize-none"
          />
        </div>
      )}
    </div>
  );
}

export default EditModuleCharacter;
