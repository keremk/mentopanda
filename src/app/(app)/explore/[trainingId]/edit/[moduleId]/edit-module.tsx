"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Module, Training, UpdateModuleInput } from "@/data/trainings";
import { updateModuleAction } from "@/app/(app)/trainingActions";

type Props = {
  training: Training;
  module: Module;
};

export function ModuleEditForm({ training, module }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateModuleInput>({
    id: module.id,
    trainingId: training.id,
    title: module.title,
    instructions: module.instructions,
    prompt: module.prompt,
    videoUrl: module.videoUrl,
    audioUrl: module.audioUrl,
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      if (JSON.stringify(debouncedFormData) !== JSON.stringify(module)) {
        await updateModuleAction(debouncedFormData);
      }
    };
    updateData();
  }, [debouncedFormData, module]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/explore/${training.id}/edit`)}
        >
          Back to Training
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Instructions</label>
          <Textarea
            name="instructions"
            value={formData.instructions || ""}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Prompt</label>
          <Textarea
            name="prompt"
            value={formData.prompt || ""}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Video URL</label>
          <Input
            name="videoUrl"
            value={formData.videoUrl || ""}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Audio URL</label>
          <Input
            name="audioUrl"
            value={formData.audioUrl || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ModuleEditForm; 