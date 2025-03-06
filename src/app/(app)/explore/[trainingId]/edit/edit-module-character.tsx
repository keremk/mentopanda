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

type Props = {
  module: Module;
};

export function EditModuleCharacter({ module }: Props) {
  const { selectedModule, updateModuleField } = useModuleEdit();
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

  const handleCharacterChange = async (newCharacterId: number) => {
    if (!selectedModule?.modulePrompt.characters.length) return;
    const currentCharacterId = selectedModule.modulePrompt.characters[0].id;

    if (newCharacterId !== currentCharacterId) {
      try {
        await selectCharacter(newCharacterId);

      } catch (error) {
        console.error("Error changing character:", error);
      }
    }
  };

  if (!selectedModule) return null;

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4">
        {selectedModule.modulePrompt.characters.length > 0 ? (
          <Select
            value={selectedModule.modulePrompt.characters[0].id.toString()}
            onValueChange={(value) => {
              const newCharacterId = parseInt(value);
              handleCharacterChange(newCharacterId);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a character">
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
                  <span>{selectedModule.modulePrompt.characters[0].name}</span>
                </div>
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
        ) : (
          <span className="text-sm text-muted-foreground">
            No character assigned to this module
          </span>
        )}
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
