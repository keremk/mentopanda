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

type Props = {
  module: Module;
};

export function EditModuleCharacter({ module }: Props) {
  const { selectedModule, updateModuleField } = useModuleEdit();
  const {
    characterPrompts,
    updateCharacterPrompt,
    replaceCharacter,
    characters,
  } = useCharacterPrompt();

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
    updateCharacterPrompt(selectedModule.modulePrompt.characters[0].id, value);
  };

  const handleCharacterChange = async (newCharacterId: number) => {
    if (!selectedModule?.modulePrompt.characters.length) return;
    const currentCharacterId = selectedModule.modulePrompt.characters[0].id;
    if (newCharacterId !== currentCharacterId) {
      try {
        // First update the database
        await replaceCharacter(currentCharacterId, newCharacterId);

        // Then update the local state
        const newCharacter = characters.find((c) => c.id === newCharacterId);
        if (newCharacter && selectedModule) {
          const now = new Date();
          const updatedModulePrompt = {
            ...selectedModule.modulePrompt,
            characters: [
              {
                id: newCharacterId,
                name: newCharacter.name,
                avatarUrl: newCharacter.avatarUrl,
                aiModel: newCharacter.aiModel,
                voice: null,
                aiDescription: null,
                description: null,
                projectId: selectedModule.modulePrompt.characters[0].projectId,
                createdBy: null,
                createdAt: now,
                updatedAt: now,
                prompt: "",
                ordinal: 0,
              },
            ],
          };

          // Use Promise.resolve to ensure this runs in the next tick
          Promise.resolve().then(() => {
            updateModuleField("modulePrompt", updatedModulePrompt);
          });
        }
      } catch (error) {
        console.error("Error replacing character:", error);
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
            value={
              characterPrompts[selectedModule.modulePrompt.characters[0].id] ??
              ""
            }
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
