"use client";

import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { ModuleCharacter } from "@/data/modules";
import { logger } from "@/lib/logger";
import { ImageEdit } from "@/components/image-edit";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AI_MODELS } from "@/types/models";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SkillsDialog } from "@/components/skills-dialog";
import { TraitsDialog } from "@/components/traits-dialog";
import { Skills, Traits } from "@/types/character-attributes";

export function EditModuleCharacter() {
  const { state, dispatch, getModuleById, createAndAssignCharacterToModule } =
    useTrainingEdit();
  const { selectedModuleId } = state;
  const selectedModule = getModuleById(selectedModuleId);
  const { toast } = useToast();

  const [isCreateCharDialogOpen, setIsCreateCharDialogOpen] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const createDialogCloseRef = useRef<HTMLButtonElement>(null);

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

  const handleImageChange = async (
    newUrl: string | null,
    newPath: string,
    oldImageUrl: string | null
  ) => {
    if (!selectedModule || !selectedModule.modulePrompt.characters[0]) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;
    logger.debug("Image changed to:", { newUrl, oldImageUrl });
    dispatch({
      type: "UPDATE_MODULE_CHARACTER_FIELD",
      payload: {
        moduleId: selectedModule.id,
        characterId,
        field: "avatarUrl",
        value: newUrl,
      },
    });
  };

  const handleNameChange = (value: string) => {
    if (!selectedModule || !selectedModule.modulePrompt.characters[0]) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;
    logger.debug("Name changed to:", value);
    dispatch({
      type: "UPDATE_MODULE_CHARACTER_FIELD",
      payload: {
        moduleId: selectedModule.id,
        characterId,
        field: "name",
        value: value,
      },
    });
  };

  const handleVoiceChange = (voice: string | undefined) => {
    if (!selectedModule || !selectedModule.modulePrompt.characters[0]) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;
    logger.debug("Voice changed to:", voice);
    dispatch({
      type: "UPDATE_MODULE_CHARACTER_FIELD",
      payload: {
        moduleId: selectedModule.id,
        characterId,
        field: "voice",
        value: voice === undefined ? null : voice,
      },
    });
  };

  const handleSkillsChange = (skills: Skills) => {
    if (!selectedModule || !selectedModule.modulePrompt.characters[0]) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;
    logger.debug("Skills changed to:", skills);
    dispatch({
      type: "UPDATE_MODULE_CHARACTER_SKILLS",
      payload: {
        moduleId: selectedModule.id,
        characterId,
        skills,
      },
    });
  };

  const handleTraitsChange = (traits: Traits) => {
    if (!selectedModule || !selectedModule.modulePrompt.characters[0]) return;
    const characterId = selectedModule.modulePrompt.characters[0].id;
    logger.debug("Traits changed to:", traits);
    dispatch({
      type: "UPDATE_MODULE_CHARACTER_TRAITS",
      payload: {
        moduleId: selectedModule.id,
        characterId,
        traits: traits,
      },
    });
  };

  const handleCreateNewCharacter = async () => {
    if (!selectedModule || !newCharacterName.trim()) return;
    try {
      await createAndAssignCharacterToModule(
        selectedModule.id,
        newCharacterName.trim()
      );
      setNewCharacterName("");
      createDialogCloseRef.current?.click();
      setIsCreateCharDialogOpen(false);
      toast({
        title: "Character Created",
        description: `Successfully created and assigned '${newCharacterName.trim()}'.`,
      });
    } catch (error) {
      logger.error("Failed to create and assign character from dialog:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create character. Please try again.",
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
  const currentCharacterPrompt = currentCharacter?.prompt || "";

  if (!currentCharacter) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 border border-border/50 rounded-lg bg-secondary/10 shadow-sm space-y-4">
        <p className="text-muted-foreground text-center">
          This module doesn&apos;t have a character yet.
        </p>
        <Dialog
          open={isCreateCharDialogOpen}
          onOpenChange={setIsCreateCharDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="brand">Create New Character</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Character for Module</DialogTitle>
              <DialogDescription>
                Enter the name for the new character. This character will be
                specifically for this module.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCharacterName.trim()) {
                  handleCreateNewCharacter();
                }
              }}
              placeholder="Character name"
              className="my-4"
            />
            <DialogFooter>
              <DialogClose ref={createDialogCloseRef} asChild>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateCharDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleCreateNewCharacter}
                variant="brand"
                disabled={!newCharacterName.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-border/50 rounded-lg p-5 bg-secondary/10 shadow-sm">
        <div className="flex gap-8 items-start">
          {currentCharacter ? (
            <>
              <div className="w-32 flex-shrink-0">
                <ImageEdit
                  initialImageUrl={currentCharacter.avatarUrl || null}
                  bucketName="avatars"
                  storageFolderPath={`character-avatars/${currentCharacter.id}`}
                  contextId={currentCharacter.id.toString()}
                  contextType="character"
                  aspectRatio="square"
                  onImageChange={handleImageChange}
                  imageShape="circle"
                  imageContainerClassName="h-24 w-24"
                  buttonSpacing="mt-2"
                  buttonSize="sm"
                  buttonVariant="ghost-brand"
                  showButtonLabels={false}
                  title="Update Character Avatar"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Name
                    </label>
                    <AIFocusInput
                      name="characterName"
                      placeholder="Character Name"
                      value={currentCharacter.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="bg-secondary/30 rounded-lg border-border/30 shadow-sm text-sm h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Character Attributes
                    </label>
                    <div className="flex gap-2">
                      <SkillsDialog
                        mode="training-edit"
                        skills={currentCharacter.skills}
                        onSave={handleSkillsChange}
                      />
                      <TraitsDialog
                        mode="training-edit"
                        traits={currentCharacter.traits}
                        onSave={handleTraitsChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Voice
                  </label>
                  <CharacterVoiceSelect
                    value={
                      (currentCharacter as ModuleCharacter).voice || undefined
                    }
                    onValueChange={handleVoiceChange}
                    aiModel={
                      currentCharacter.aiModel === AI_MODELS.OPENAI ||
                      currentCharacter.aiModel === AI_MODELS.GEMINI
                        ? currentCharacter.aiModel
                        : AI_MODELS.OPENAI
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">
              No character assigned to this module. Please assign one via module
              settings.
            </div>
          )}
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
            className="min-h-[calc(100vh-38rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300"
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
}

export default EditModuleCharacter;
