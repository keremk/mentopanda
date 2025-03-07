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

  useEffect(() => {
    if (!module) return;

    // Get the first character if available
    const character =
      module.modulePrompt.characters.length > 0
        ? module.modulePrompt.characters[0]
        : null;

    initializeCharacter(character);
  }, [module.modulePrompt.characters, initializeCharacter]);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
      <div className="border rounded-md p-4">
        <div className="flex gap-2">
          <Select
            value={currentCharacterId || ""}
            onValueChange={handleCharacterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assign Character">
                {currentCharacterId && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={
                          selectedModule.modulePrompt.characters[0].avatarUrl ||
                          undefined
                        }
                      />
                      <AvatarFallback>
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
            <SelectContent>
              {characters.map((character: CharacterSummary) => (
                <SelectItem
                  key={character.id}
                  value={character.id.toString()}
                  className="flex items-center space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={character.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(character.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{character.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/characters">Manage</Link>
          </Button>
        </div>
      </div>

      {selectedModule.modulePrompt.characters.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Character Prompt
          </label>
          <Textarea
            value={characterPrompt}
            onChange={(e) => handleCharacterPromptChange(e.target.value)}
            placeholder="Enter the character's prompt..."
            rows={10}
          />
        </div>
      )}
    </div>
  );
}

export default EditModuleCharacter;
