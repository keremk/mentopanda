"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Module, Training, UpdateTrainingInput } from "@/data/trainings";
import {
  updateTrainingAction,
  createModuleAction,
  deleteModuleAction,
} from "@/app/(app)/trainingActions";
import { PlusIcon, TrashIcon, PencilIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  training: Training;
  modules: Module[];
};

export function EditTrainingForm({ training, modules }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateTrainingInput>({
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.imageUrl,
    previewUrl: training.previewUrl,
    isPublic: training.isPublic,
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      if (JSON.stringify(debouncedFormData) !== JSON.stringify(training)) {
        await updateTrainingAction(debouncedFormData);
      }
    };
    updateData();
  }, [debouncedFormData, training]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleAddModule = async () => {
    const newModule = await createModuleAction(training.id, {
      title: "New Module",
      instructions: null,
      prompt: null,
      videoUrl: null,
      audioUrl: null,
    });
    router.refresh();
  };

  const handleDeleteModule = async (moduleId: number) => {
    await deleteModuleAction(moduleId, training.id);
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tagline</label>
            <Input
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preview URL</label>
            <Input
              name="previewUrl"
              value={formData.previewUrl || ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isPublic}
              onCheckedChange={handleSwitchChange}
            />
            <label className="text-sm font-medium">Public</label>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Modules</h2>
          <Button onClick={handleAddModule}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Module
          </Button>
        </div>

        <div className="space-y-2">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="flex items-center justify-between p-4"
            >
              <span className="text-foreground">{module.title}</span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/explore/${training.id}/edit/${module.id}`)
                  }
                >
                  <PencilIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteModule(module.id)}
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EditTrainingForm;