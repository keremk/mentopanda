"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AIModel } from "@/types/models";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { MarkdownEditor } from "@/components/markdown-editor";
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex items-center gap-3">
        {saveStatus === "saving" && (
          <span className="text-sm text-muted-foreground">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-sm text-green-500">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-500">Error saving</span>
        )}
        <Button variant="outline" onClick={handleSave}>
          Save
        </Button>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-[120px_1fr] gap-16">
          <div className="space-y-4 flex flex-col items-center">
            <Avatar className="h-[120px] w-[120px]">
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
              dialogTitle="Upload Character Image"
              buttonVariant="outline"
              buttonSize="default"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                name="name"
                value={character.name}
                onChange={(e) => updateCharacterField("name", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Voice</label>
              <CharacterVoiceSelect
                value={character.voice || undefined}
                onValueChange={(voice) => updateCharacterField("voice", voice)}
                aiModel={character.aiModel as AIModel}
              />
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Description</h3>
          <p className="text-sm text-muted-foreground">
            The character description that will be visible to users.
          </p>
          <div className="border rounded-md">
            <MarkdownEditor
              key={`description-${character.id}`}
              content={character.description || ""}
              onChange={(markdown) =>
                updateCharacterField("description", markdown)
              }
              className="min-h-[250px]"
            />
          </div>
        </div>

        {/* AI Description Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">AI Description</h3>
          <p className="text-sm text-muted-foreground">
            The character prompt that will be sent to the AI model.
          </p>
          <div className="border rounded-md">
            <MarkdownEditor
              key={`ai-description-${character.id}`}
              content={character.aiDescription || ""}
              onChange={(markdown) =>
                updateCharacterField("aiDescription", markdown)
              }
              className="min-h-[300px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
