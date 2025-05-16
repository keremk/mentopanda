"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AIModel } from "@/types/models";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { ImageEdit } from "@/components/image-edit";
import { useCharacterDetails } from "@/contexts/character-details-context";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { AIPane } from "@/components/aipane";
import { AIPaneProvider } from "@/contexts/ai-pane-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { AIFocusInput } from "@/components/ai-focus-input";
import { ApiKeyCheckDialog } from "@/components/api-key-check-dialog";
import { User } from "@/data/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
type EditCharacterFormProps = {
  user: User;
};

export function EditCharacterForm({ user }: EditCharacterFormProps) {
  const { toast } = useToast();
  const { character, updateCharacterField, saveStatus, saveCharacter } =
    useCharacterDetails();
  const [isAIPaneOpen, setIsAIPaneOpen] = useState(false);

  // Use character-specific AI context
  const getAIPaneContext = () => {
    return {
      contextType: "character" as const,
      contextData: {
        characterId: String(character.id),
      },
      onApplyContent: (content: string, targetField: string) => {
        if (targetField === "aiDescription") {
          updateCharacterField("aiDescription", content);
        } else if (targetField === "description") {
          updateCharacterField("description", content);
        } else if (targetField === "name") {
          updateCharacterField("name", content);
        }
      },
    };
  };

  // Get AI pane context
  const aiPaneContext = getAIPaneContext();

  // Keyboard shortcut handler for AI Pane toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsAIPaneOpen(!isAIPaneOpen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAIPaneOpen]);

  const handleToggleAIPane = () => {
    setIsAIPaneOpen(!isAIPaneOpen);
  };

  const handleSave = async () => {
    const success = await saveCharacter();
    if (success) {
      // Toast handled in handleImageChange or direct save button
      // toast({
      //   title: "Character saved",
      //   description: "Your character has been saved successfully",
      // });
    } else {
      logger.error("Failed to save character details.");
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save character details.",
      });
    }
  };

  // Handler for ImageEdit component changes
  const handleImageChange = async (
    newUrl: string,
    newPath: string, // Path is available if needed for future logic
    oldImageUrl: string | null
  ) => {
    logger.debug("[EditCharacterForm] Image changed:", { newUrl, oldImageUrl });
    updateCharacterField("avatarUrl", newUrl); // Update context

    // Trigger save
    const saveSuccess = await saveCharacter();

    if (saveSuccess) {
      toast({ title: "Avatar updated and saved!" });
    } else {
      logger.error("Failed to save avatar.");
      toast({
        variant: "destructive",
        title: "Failed to save avatar",
        description: "Could not save character after avatar update.",
      });
      // Note: ImageEdit handles optimistic UI update, but here we might
      // ideally want to revert the context state if save fails.
      // For simplicity, we'll rely on the user seeing the error and potentially re-saving.
      // Or, we could force a re-fetch of character data on failure.
    }
  };

  return (
    <AIPaneProvider
      contextType={aiPaneContext.contextType}
      contextData={aiPaneContext.contextData}
      onApplyContent={aiPaneContext.onApplyContent}
    >
      <div className="h-full px-6 flex flex-col">
        <ApiKeyCheckDialog isOpenAIModule={true} user={user} />
        <div className="absolute top-0 right-0 p-4 z-10 flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-green-500">Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-500">Error saving</span>
          )}
          <Button
            variant="ghost-brand"
            onClick={handleSave}
            size="default"
            className="h-9"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAIPaneOpen ? "brand" : "ghost-brand"}
                size="icon"
                onClick={handleToggleAIPane}
                className="h-9 w-9"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle AI Pane (⌘K)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Horizontal flex container for main content and AI Pane */}
        <div className="flex w-full flex-1 mt-8">
          {" "}
          {/* mt-8 for spacing, similar to edit-container */}
          {/* Left Side: Character Details (Image, Name, Voice) + Tabs */}
          <div className="flex-1 min-w-0 pr-4 flex flex-col">
            {" "}
            {/* pr-4 for spacing before AI Pane */}
            <div className="flex gap-8 items-start mb-6">
              {" "}
              {/* mb-6 for spacing between details and tabs */}
              <div className="w-48 flex-shrink-0">
                <ImageEdit
                  initialImageUrl={character.avatarUrl}
                  bucketName="avatars"
                  storageFolderPath={`character-avatars/${character.id}`}
                  contextId={character.id.toString()}
                  contextType="character"
                  aspectRatio="square"
                  onImageChange={handleImageChange}
                  imageShape="circle"
                  imageContainerClassName="h-32 w-32"
                  buttonSpacing="mt-3"
                  buttonSize="sm"
                  buttonVariant="ghost-brand"
                  showButtonLabels={false}
                />
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <AIFocusInput
                    name="name"
                    placeholder="Character Name"
                    value={character.name}
                    onChange={(e) =>
                      updateCharacterField("name", e.target.value)
                    }
                    className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Voice
                  </label>
                  <CharacterVoiceSelect
                    value={character.voice || undefined}
                    onValueChange={(voice) =>
                      updateCharacterField("voice", voice)
                    }
                    aiModel={character.aiModel as AIModel}
                  />
                </div>
              </div>
            </div>
            <Tabs
              defaultValue="description"
              className="w-full flex flex-col flex-1 min-h-0"
            >
              <TabsList className="grid grid-cols-2 rounded-2xl">
                <TabsTrigger
                  value="description"
                  className="rounded-2xl focus:ring-brand focus:ring-2"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="aiDescription"
                  className="rounded-2xl focus:ring-brand focus:ring-2"
                >
                  AI Prompt
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <AIFocusTextarea
                  name="description"
                  placeholder="Enter character description visible to users"
                  value={character.description || ""}
                  onChange={(e) =>
                    updateCharacterField("description", e.target.value)
                  }
                  className="min-h-[calc(100vh-24rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
                />
              </TabsContent>
              <TabsContent value="aiDescription" className="mt-4">
                <AIFocusTextarea
                  name="aiDescription"
                  placeholder="Enter character prompt for the AI model"
                  value={character.aiDescription || ""}
                  onChange={(e) =>
                    updateCharacterField("aiDescription", e.target.value)
                  }
                  className="min-h-[calc(100vh-24rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
                />
              </TabsContent>
            </Tabs>
          </div>
          {/* Right Side: AI Pane */}
          <div
            className={cn(
              "transition-all duration-300 overflow-hidden flex-shrink-0",
              isAIPaneOpen ? "w-[435px]" : "w-0"
            )}
          >
            <AIPane isOpen={isAIPaneOpen} />
          </div>
        </div>
      </div>
    </AIPaneProvider>
  );
}
