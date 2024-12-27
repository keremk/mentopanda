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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { CharacterDetails, UpdateCharacterInput } from "@/data/characters";
import { updateCharacterAction } from "@/app/actions/character-actions";
import { CharacterVoiceSelect } from "@/components/character-voice-select";
import { AIModel, voices } from "@/data/characters";

const AI_MODELS = Object.keys(voices) as AIModel[];

type Props = {
  character: CharacterDetails;
};

export function EditCharacterForm({ character }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateCharacterInput>({
    name: character.name,
    voice: character.voice,
    aiModel: (character.aiModel as AIModel) || "gpt-4o-realtime",
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      if (
        debouncedFormData.name !== character.name ||
        debouncedFormData.voice !== character.voice ||
        debouncedFormData.aiModel !== character.aiModel
      ) {
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
  }, [debouncedFormData, character, router]);

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
    if (
      formData.name !== character.name ||
      formData.voice !== character.voice ||
      formData.aiModel !== character.aiModel
    ) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10">
        <Button variant="outline" onClick={handleSaveAndExit}>
          Save & Exit
        </Button>
      </div>

      <div className="space-y-4 mt-4">
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
          <Select value={formData.aiModel} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
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
  );
}
