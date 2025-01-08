"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { CharacterDetails, UpdateCharacterInput } from "@/data/characters";
import { updateCharacterAction } from "@/app/actions/character-actions";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { MarkdownEditor } from "@/components/markdown-editor";
import { ImageIcon } from "lucide-react";
import { ImageUploadButton } from "@/components/image-upload-button";
import { updateCharacterAvatarAction } from "@/app/actions/character-actions";
import { AIModel, AI_MODELS } from "@/types/models";

type Props = {
  character: CharacterDetails;
};

export function EditCharacterForm({ character }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateCharacterInput>({
    name: character.name,
    voice: character.voice,
    aiModel: character.aiModel || AI_MODELS.OPENAI,
    aiDescription: character.aiDescription || "",
    description: character.description || "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl);

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const isChanged =
      formData.name !== character.name ||
      formData.voice !== character.voice ||
      formData.aiModel !== character.aiModel ||
      formData.aiDescription !== character.aiDescription ||
      formData.description !== character.description;

    setHasChanges(isChanged);
  }, [formData, character]);

  useEffect(() => {
    const updateData = async () => {
      if (hasChanges) {
        try {
          await updateCharacterAction(character.id, {
            ...debouncedFormData,
            voice: debouncedFormData.voice || null,
          });
          router.refresh();
        } catch (error) {
          console.error("Failed to update character:", error);
        }
      }
    };
    updateData();
  }, [debouncedFormData, hasChanges, character.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoiceChange = (voice: string) => {
    setFormData((prev) => ({ ...prev, voice }));
  };

  const handleModelChange = (value: AIModel) => {
    setFormData((prev) => ({
      ...prev,
      aiModel: value,
      voice: null,
    }));
  };

  const handleSaveAndExit = async () => {
    if (hasChanges) {
      try {
        await updateCharacterAction(character.id, {
          ...formData,
          voice: formData.voice || null,
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to save character:", error);
      }
    }
    router.push(`/characters/${character.id}`);
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
        console.error("Failed to update avatar:", response.error);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10">
        <Button variant="outline" onClick={handleSaveAndExit}>
          Save & Exit
        </Button>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-[200px_1fr] gap-16">
          <div className="space-y-4 flex flex-col items-center">
            <Avatar className="h-[200px] w-[200px]">
              <AvatarImage src={avatarUrl || undefined} alt={character.name} />
              <AvatarFallback className="text-4xl">
                <ImageIcon className="h-20 w-20 text-muted-foreground" />
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
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium">AI Model</label>
              <Select
                value={formData.aiModel || undefined}
                onValueChange={handleModelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AI_MODELS).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Voice</label>
              <CharacterVoiceSelect
                value={formData.voice || undefined}
                onValueChange={handleVoiceChange}
                aiModel={formData.aiModel as AIModel}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="ai-description" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-description">AI Description</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-description" className="space-y-4 mt-4">
            <MarkdownEditor
              content={formData.aiDescription || ""}
              onChange={(markdown) =>
                setFormData((prev) => ({ ...prev, aiDescription: markdown }))
              }
              className="min-h-[300px]"
            />
          </TabsContent>

          <TabsContent value="description" className="space-y-4 mt-4">
            <MarkdownEditor
              content={formData.description || ""}
              onChange={(markdown) =>
                setFormData((prev) => ({ ...prev, description: markdown }))
              }
              className="min-h-[300px]"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
