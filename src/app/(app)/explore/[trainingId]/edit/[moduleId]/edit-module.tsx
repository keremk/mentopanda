"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Module } from "@/data/modules";
import { updateModuleAction } from "@/app/actions/moduleActions";
import { UpdateModuleInput } from "@/data/modules";
import { MarkdownEditor } from "@/components/markdown-editor";
import { CharacterSelect } from "@/components/character-select";
import { updateModuleCharacterPromptAction } from "@/app/actions/modules-characters-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AI_MODELS } from "@/types/models";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { AIModel } from "@/types/models";

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
      aiModel: module.modulePrompt.aiModel || AI_MODELS.OPENAI,
      scenario: module.modulePrompt.scenario || "",
      assessment: module.modulePrompt.assessment || "",
      moderator: module.modulePrompt.moderator || "",
      characters: module.modulePrompt.characters || [
        {
          name: "",
          prompt: "",
          voice: "",
        },
      ],
    },
  });

  const debouncedFormData = useDebounce(formData, 1000);

  const [selectedCharacterId, setSelectedCharacterId] = useState<
    number | undefined
  >();

  const [characterPrompts, setCharacterPrompts] = useState<
    Record<number, string>
  >({});
  const debouncedCharacterPrompts = useDebounce(characterPrompts, 1000);

  const [lastSavedModule, setLastSavedModule] = useState(module);

  useEffect(() => {
    const initialPrompts = module.modulePrompt.characters.reduce(
      (acc, char) => ({
        ...acc,
        [char.id]: char.prompt || "",
      }),
      {}
    );
    setCharacterPrompts(initialPrompts);
  }, [module.id, module.modulePrompt.characters]);

  useEffect(() => {
    const updateCharacterPrompt = async () => {
      if (!selectedCharacterId) return;

      const newPrompt = debouncedCharacterPrompts[selectedCharacterId];
      if (newPrompt === undefined) return;

      const result = await updateModuleCharacterPromptAction({
        moduleId: module.id,
        characterId: selectedCharacterId,
        prompt: newPrompt,
      });

      if (!result.success) {
        console.error(result.error);
      }
    };

    updateCharacterPrompt();
  }, [debouncedCharacterPrompts, selectedCharacterId, module.id]);

  const handleCharacterPromptChange = (value: string) => {
    if (!selectedCharacterId) return;

    setCharacterPrompts((prev) => ({
      ...prev,
      [selectedCharacterId]: value,
    }));
  };

  useEffect(() => {
    const updateData = async () => {
      const hasChanges =
        debouncedFormData.title !== lastSavedModule.title ||
        debouncedFormData.instructions !== lastSavedModule.instructions ||
        debouncedFormData.modulePrompt.scenario !==
          lastSavedModule.modulePrompt.scenario ||
        debouncedFormData.modulePrompt.assessment !==
          lastSavedModule.modulePrompt.assessment ||
        debouncedFormData.modulePrompt.moderator !==
          lastSavedModule.modulePrompt.moderator ||
        debouncedFormData.modulePrompt.aiModel !==
          lastSavedModule.modulePrompt.aiModel ||
        JSON.stringify(debouncedFormData.modulePrompt.characters) !==
          JSON.stringify(lastSavedModule.modulePrompt.characters);

      if (hasChanges) {
        const updatedModule = await updateModuleAction(debouncedFormData);
        setLastSavedModule({
          ...updatedModule,
          modulePrompt: {
            ...updatedModule.modulePrompt,
            characters: lastSavedModule.modulePrompt.characters,
          },
        });
      }
    };
    updateData();
  }, [debouncedFormData, lastSavedModule]);

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

  // const handleCharacterChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  //   field: "name" | "prompt" | "voice"
  // ) => {
  //   const { value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     modulePrompt: {
  //       ...prev.modulePrompt,
  //       characters: [{ ...prev.modulePrompt.characters[0], [field]: value }],
  //     },
  //   }));
  // };

  const handleBackClick = async () => {
    const hasChanges =
      formData.title !== lastSavedModule.title ||
      formData.instructions !== lastSavedModule.instructions ||
      formData.modulePrompt.scenario !==
        lastSavedModule.modulePrompt.scenario ||
      formData.modulePrompt.assessment !==
        lastSavedModule.modulePrompt.assessment ||
      formData.modulePrompt.moderator !==
        lastSavedModule.modulePrompt.moderator ||
      formData.modulePrompt.aiModel !== lastSavedModule.modulePrompt.aiModel ||
      JSON.stringify(formData.modulePrompt.characters) !==
        JSON.stringify(lastSavedModule.modulePrompt.characters);

    if (hasChanges) {
      const updatedModule = await updateModuleAction(formData);
      setLastSavedModule({
        ...updatedModule,
        modulePrompt: {
          ...updatedModule.modulePrompt,
          characters: lastSavedModule.modulePrompt.characters,
        },
      });
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai-instructions">AI Instructions</TabsTrigger>
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

          {/* <div>
            <label className="text-sm font-medium">AI Model</label>
            <Select
              value={formData.modulePrompt.aiModel}
              onValueChange={(value: AIModel) =>
                setFormData((prev) => ({
                  ...prev,
                  modulePrompt: {
                    ...prev.modulePrompt,
                    aiModel: value,
                  },
                }))
              }
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
          </div> */}

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

        <TabsContent value="ai-instructions" className="mt-4">
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
              <CharacterSelect
                moduleId={module.id}
                aiModel={module.modulePrompt.aiModel}
                characters={module.modulePrompt.characters}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={(id) => {
                  setSelectedCharacterId(id);
                  setActivePrompt("character");
                }}
                onUpdate={() => {
                  router.refresh();
                }}
              />
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

              {activePrompt === "character" && selectedCharacterId && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar>
                      <AvatarImage
                        src={
                          module.modulePrompt.characters.find(
                            (c) => c.id === selectedCharacterId
                          )?.avatarUrl || undefined
                        }
                      />
                      <AvatarFallback>
                        {module.modulePrompt.characters
                          .find((c) => c.id === selectedCharacterId)
                          ?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-medium">
                      {
                        module.modulePrompt.characters.find(
                          (c) => c.id === selectedCharacterId
                        )?.name
                      }
                    </h3>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Character Prompt
                    </label>
                    <Textarea
                      value={characterPrompts[selectedCharacterId!] ?? ""}
                      onChange={(e) =>
                        handleCharacterPromptChange(e.target.value)
                      }
                      placeholder="Enter the character's prompt..."
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
