"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Module } from "@/data/modules";
import { updateModuleAction } from "@/app/(app)/moduleActions";
import { UpdateModuleInput } from "@/data/modules";

type Props = {
  module: Module;
};

export function ModuleEditForm({ module }: Props) {
  const router = useRouter();
  const [activePrompt, setActivePrompt] = useState<string>("scenario");
  const [formData, setFormData] = useState<UpdateModuleInput>({
    id: module.id,
    ordinal: module.ordinal,
    trainingId: module.trainingId,
    title: module.title,
    instructions: module.instructions,
    modulePrompt: {
      scenario: module.modulePrompt.scenario || "",
      assessment: module.modulePrompt.assessment || "",
      moderator: module.modulePrompt.moderator || "",
      characters: module.modulePrompt.characters || [{ name: "", prompt: "" }],
    },
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

  const handlePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      modulePrompt: {
        ...prev.modulePrompt,
        [field]: value,
      },
    }));
  };

  const handleCharacterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: "name" | "prompt"
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      modulePrompt: {
        ...prev.modulePrompt,
        characters: [{ ...prev.modulePrompt.characters[0], [field]: value }],
      },
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10">
        <Button
          variant="outline"
          onClick={() => router.push(`/explore/${module.trainingId}/edit`)}
        >
          Back to Training
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
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
              rows={8}
            />
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
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
        </TabsContent>

        <TabsContent value="prompts" className="mt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Button
                variant={activePrompt === "scenario" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActivePrompt("scenario")}
              >
                Scenario
              </Button>
              <Button
                variant={activePrompt === "moderator" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActivePrompt("moderator")}
              >
                Moderator
              </Button>
              <Button
                variant={activePrompt === "assessment" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActivePrompt("assessment")}
              >
                Assessment
              </Button>
              <Button
                variant={activePrompt === "character" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActivePrompt("character")}
              >
                Character
              </Button>
            </div>

            <div className="col-span-3">
              {activePrompt === "scenario" && (
                <div>
                  <label className="text-sm font-medium">Scenario Prompt</label>
                  <Textarea
                    value={formData.modulePrompt.scenario}
                    onChange={(e) => handlePromptChange(e, "scenario")}
                    rows={12}
                  />
                </div>
              )}

              {activePrompt === "moderator" && (
                <div>
                  <label className="text-sm font-medium">
                    Moderator Prompt
                  </label>
                  <Textarea
                    value={formData.modulePrompt.moderator || ""}
                    onChange={(e) => handlePromptChange(e, "moderator")}
                    rows={12}
                  />
                </div>
              )}

              {activePrompt === "assessment" && (
                <div>
                  <label className="text-sm font-medium">
                    Assessment Prompt
                  </label>
                  <Textarea
                    value={formData.modulePrompt.assessment}
                    onChange={(e) => handlePromptChange(e, "assessment")}
                    rows={12}
                  />
                </div>
              )}

              {activePrompt === "character" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Character Name
                    </label>
                    <Input
                      value={formData.modulePrompt.characters[0]?.name || ""}
                      onChange={(e) => handleCharacterChange(e, "name")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Character Prompt
                    </label>
                    <Textarea
                      value={formData.modulePrompt.characters[0]?.prompt || ""}
                      onChange={(e) => handleCharacterChange(e, "prompt")}
                      rows={10}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModuleEditForm; 