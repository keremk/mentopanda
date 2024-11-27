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
import { MarkdownEditor } from "@/components/markdown-editor";
import { VoiceCombobox } from "@/components/voice-combobox";

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
      characters: module.modulePrompt.characters || [{ 
        name: "", 
        prompt: "", 
        voice: ""
      }],
    },
    videoUrl: module.videoUrl,
    audioUrl: module.audioUrl,
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const updateData = async () => {
      const hasChanges =
        debouncedFormData.title !== module.title ||
        debouncedFormData.instructions !== module.instructions ||
        debouncedFormData.videoUrl !== module.videoUrl ||
        debouncedFormData.audioUrl !== module.audioUrl ||
        debouncedFormData.modulePrompt.scenario !==
          module.modulePrompt.scenario ||
        debouncedFormData.modulePrompt.assessment !==
          module.modulePrompt.assessment ||
        debouncedFormData.modulePrompt.moderator !==
          module.modulePrompt.moderator ||
        JSON.stringify(debouncedFormData.modulePrompt.characters) !==
          JSON.stringify(module.modulePrompt.characters);

      if (hasChanges) {
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
    field: "name" | "prompt" | "voice"
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

  const handleBackClick = async () => {
    // Check for unsaved changes
    const hasChanges =
      formData.title !== module.title ||
      formData.instructions !== module.instructions ||
      formData.videoUrl !== module.videoUrl ||
      formData.audioUrl !== module.audioUrl ||
      formData.modulePrompt.scenario !== module.modulePrompt.scenario ||
      formData.modulePrompt.assessment !== module.modulePrompt.assessment ||
      formData.modulePrompt.moderator !== module.modulePrompt.moderator ||
      JSON.stringify(formData.modulePrompt.characters) !==
        JSON.stringify(module.modulePrompt.characters);

    if (hasChanges) {
      await updateModuleAction(formData);
    }

    router.push(`/explore/${module.trainingId}/edit`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10">
        <Button variant="outline" onClick={handleBackClick}>
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
            <label className="text-sm font-medium mb-2 block">
              Instructions
            </label>
            <div className="border rounded-md">
              <MarkdownEditor
                content={formData.instructions || ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, instructions: value }))
                }
                className="min-h-[300px]"
              />
            </div>
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
                  <Textarea
                    value={formData.modulePrompt.scenario}
                    onChange={(e) => handlePromptChange(e, "scenario")}
                    rows={12}
                  />
                </div>
              )}

              {activePrompt === "moderator" && (
                <div>
                  <Textarea
                    value={formData.modulePrompt.moderator || ""}
                    onChange={(e) => handlePromptChange(e, "moderator")}
                    rows={12}
                  />
                </div>
              )}

              {activePrompt === "assessment" && (
                <div>
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
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.modulePrompt.characters[0]?.name || ""}
                      onChange={(e) => handleCharacterChange(e, "name")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Voice</label>
                    <VoiceCombobox
                      value={formData.modulePrompt.characters[0]?.voice || ""}
                      onChange={(value) => 
                        handleCharacterChange(
                          { target: { value } } as React.ChangeEvent<HTMLInputElement>,
                          "voice"
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prompt</label>
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
