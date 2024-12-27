"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { CharacterDetails, UpdateCharacterInput } from "@/data/characters";
import { updateCharacterAction } from "@/app/actions/character-actions";

type Props = {
  character: CharacterDetails;
};

export function EditCharacterForm({ character }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateCharacterInput>({
    name: character.name,
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      if (debouncedFormData.name !== character.name) {
        await updateCharacterAction(character.id, debouncedFormData);
        router.refresh();
      }
    };
    updateData();
  }, [debouncedFormData, character, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAndExit = async () => {
    if (formData.name !== character.name) {
      await updateCharacterAction(character.id, formData);
    }
    router.push(`/characters/${character.id}`);
    router.refresh();
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
      </div>
    </div>
  );
}
