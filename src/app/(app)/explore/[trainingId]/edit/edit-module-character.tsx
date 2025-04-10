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
import { useModuleEdit } from "@/contexts/module-edit-context";
import { useCharacterPrompt } from "@/contexts/character-prompt-context";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";

type EditModuleCharacterProps = {
  isFullScreen?: boolean;
};

export function EditModuleCharacter({
  isFullScreen = false,
}: EditModuleCharacterProps) {
  const { toast } = useToast();
  const { selectedModule } = useModuleEdit();

  const {
    characterPrompt,
    updateCharacterPrompt,
    selectCharacter,
    characters,
    initializeCharacter,
    selectedCharacterId,
  } = useCharacterPrompt();

  // Initialize character conditionally when module or its character changes
  useEffect(() => {
    if (!selectedModule) return;

    // Get the potential new character from the module prop
    const characterFromModule =
      selectedModule.modulePrompt.characters.length > 0
        ? selectedModule.modulePrompt.characters[0]
        : null;
    const newCharacterId = characterFromModule?.id;

    // Only initialize if the character ID has changed OR if the user hasn't made edits
    if (newCharacterId !== selectedCharacterId) {
      initializeCharacter(characterFromModule);
    }
    // Dependencies updated to include the check conditions
  }, [
    selectedModule,
    selectedCharacterId, // Add context's character ID
    initializeCharacter,
  ]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // CMD+K / CTRL+K shortcut when field is focused will open AI pane
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      // This will also trigger the global keyboard handler
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
          <Button variant="ghost-brand" asChild>
            <Link href="/characters">Manage</Link>
          </Button>
        </div>
      </div>

      {selectedModule.modulePrompt.characters.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Character Prompt
          </label>
          <AIFocusTextarea
            name="characterPrompt"
            value={characterPrompt}
            onChange={(e) => handleCharacterPromptChange(e.target.value)}
            placeholder="Enter the prompt about how this character should behave in this scenario"
            rows={10}
            className={`${isFullScreen ? "min-h-[calc(100vh-19rem)]" : "min-h-[calc(100vh-50rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
}

export default EditModuleCharacter;
