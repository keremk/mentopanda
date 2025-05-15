"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CharacterSummary } from "@/data/characters";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import {
  replaceModuleCharacterAction,
  insertModuleCharacterAction,
} from "@/app/actions/modules-characters-actions";
import { ModuleCharacter } from "@/data/modules";
import { logger } from "@/lib/logger";
export function EditModuleCharacter() {
  const { toast } = useToast();
  const { state, dispatch, getModuleById } = useTrainingEdit();
  const { selectedModuleId, availableCharacters } = state;

  const selectedModule = getModuleById(selectedModuleId);

  const handleCharacterPromptChange = (value: string) => {
    if (!selectedModule?.modulePrompt.characters.length) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;

    dispatch({
      type: "UPDATE_MODULE_CHARACTER_PROMPT",
      payload: {
        moduleId: selectedModule.id,
        characterId: characterId,
        prompt: value,
      },
    });
  };

  const handleCharacterChange = async (value: string) => {
    if (!selectedModule || !value) return;

    const newCharacterId = parseInt(value);
    const currentCharacter = selectedModule.modulePrompt.characters[0];
    const newCharacterSummary = availableCharacters.find(
      (c) => c.id === newCharacterId
    );

    if (!newCharacterSummary) {
      logger.error("Selected character not found in available list");
      toast({
        title: "Error selecting character",
        description: "Character not found.",
      });
      return;
    }

    const newModuleCharacterData = {
      id: newCharacterSummary.id,
      name: newCharacterSummary.name,
      avatarUrl: newCharacterSummary.avatarUrl,
      aiModel: newCharacterSummary.aiModel,
      prompt: "",
    };

    try {
      if (currentCharacter) {
        await replaceModuleCharacterAction({
          moduleId: selectedModule.id,
          oldCharacterId: currentCharacter.id,
          newCharacterId: newCharacterId,
        });
      } else {
        await insertModuleCharacterAction({
          moduleId: selectedModule.id,
          characterId: newCharacterId,
        });
      }
      dispatch({
        type: "SELECT_MODULE_CHARACTER",
        payload: {
          moduleId: selectedModule.id,
          character: newModuleCharacterData as ModuleCharacter,
        },
      });

      toast({ title: "Character assigned" });
    } catch (error) {
      logger.error("Error assigning character:", error);
      toast({
        title: "Error assigning character",
        description: "Please try again.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
    }
  };

  if (!selectedModule) return null;

  const currentCharacter = selectedModule.modulePrompt.characters[0];
  const currentCharacterId = currentCharacter?.id.toString();
  const currentCharacterPrompt = currentCharacter?.prompt || "";

  return (
    <div className="space-y-6">
      <div className="border border-border/50 rounded-lg p-5 bg-secondary/10 shadow-sm">
        <div className="flex gap-3">
          <Select
            value={currentCharacterId || ""}
            onValueChange={handleCharacterChange}
          >
            <SelectTrigger className="w-full bg-background/90 border-border/50 rounded-2xl focus:ring-brand focus:ring-2">
              <SelectValue placeholder="Assign Character">
                {currentCharacter ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6 border border-border/30">
                      <AvatarImage
                        src={currentCharacter.avatarUrl || undefined}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(currentCharacter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{currentCharacter.name}</span>
                  </div>
                ) : (
                  "Assign Character"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-border/50 bg-background/95 backdrop-blur-sm rounded-2xl ring-2 ring-brand">
              {availableCharacters.map((character: CharacterSummary) => (
                <SelectItem key={character.id} value={character.id.toString()}>
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
          <Button variant="ghost-brand" asChild>
            <Link href="/characters">Manage</Link>
          </Button>
        </div>
      </div>

      {currentCharacter && (
        <div className="flex flex-col gap-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Character Prompt
          </label>
          <AIFocusTextarea
            name="characterPrompt"
            value={currentCharacterPrompt}
            onChange={(e) => handleCharacterPromptChange(e.target.value)}
            placeholder="Enter the prompt about how this character should behave in this scenario"
            rows={10}
            className="min-h-[calc(100vh-31rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300"
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
}

export default EditModuleCharacter;
