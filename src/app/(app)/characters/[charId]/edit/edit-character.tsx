"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AIModel } from "@/types/models";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "@/components/image-upload-button";
import { updateCharacterAvatarAction } from "@/app/actions/character-actions";
import { useCharacterDetails } from "@/contexts/character-details-context";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";

export function EditCharacterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { character, updateCharacterField, saveStatus, saveCharacter } =
    useCharacterDetails();
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl);

  const handleSave = async () => {
    const success = await saveCharacter();
    if (success) {
      toast({
        title: "Character saved",
        description: "Your character has been saved successfully",
      });
    }
  };

  async function handleAvatarUpload(url: string) {
    setIsAvatarUpdating(true);
    try {
      const response = await updateCharacterAvatarAction(character.id, {
        avatarUrl: url,
      });
      if (response.success) {
        setAvatarUrl(url);
        router.refresh();
      } else {
        toast({
          title: "Failed to update avatar",
          description: response.error,
        });
        console.log(`Failed to update avatar: ${response.error}`);
      }
    } catch (error) {
      console.log(`Failed to update avatar: ${error}`);
      toast({
        title: "Failed to update avatar",
        description: "An error occurred while updating the avatar",
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  return (
    <div className="h-full space-y-6 px-6">
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
        <Button variant="brand" onClick={handleSave}>
          Save
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex gap-8 items-start">
          <div className="space-y-4 flex flex-col items-center w-48">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl || undefined} alt={character.name} />
              <AvatarFallback className="text-4xl">
                {getInitials(character.name)}
              </AvatarFallback>
            </Avatar>
            <ImageUploadButton
              bucket="avatars"
              folder="character-avatars"
              onUploadComplete={handleAvatarUpload}
              buttonText={isAvatarUpdating ? "Uploading..." : "Upload Image"}
              buttonVariant="ghost-brand"
              buttonSize="default"
            />
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <Input
                name="name"
                value={character.name}
                onChange={(e) => updateCharacterField("name", e.target.value)}
                className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Voice
              </label>
              <CharacterVoiceSelect
                value={character.voice || undefined}
                onValueChange={(voice) => updateCharacterField("voice", voice)}
                aiModel={character.aiModel as AIModel}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <Textarea
            value={character.description || ""}
            onChange={(e) =>
              updateCharacterField("description", e.target.value)
            }
            placeholder="Enter character description visible to users"
            className="min-h-[300px] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            AI Description
          </label>
          <Textarea
            value={character.aiDescription || ""}
            onChange={(e) =>
              updateCharacterField("aiDescription", e.target.value)
            }
            placeholder="Enter character prompt for the AI model"
            className="min-h-[400px] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    </div>
  );
}
