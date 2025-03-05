"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { useCharacterPrompt } from "@/contexts/character-prompt-context";
import { EditModuleCharacter } from "./edit-module-character";

type Props = {
  module: Module;
};

export function EditModuleForm({ module }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("scenario");

  // Use the contexts
  const { updateModuleField, selectModule, selectedModule } = useModuleEdit();
  const { initializeCharacter } = useCharacterPrompt();

  // Initialize the module in context
  useEffect(() => {
    selectModule(module.id);
  }, [module.id, selectModule]);

  // Initialize character prompt
  useEffect(() => {
    if (!selectedModule) return;

    // Get the first character if available
    const character =
      selectedModule.modulePrompt.characters.length > 0
        ? selectedModule.modulePrompt.characters[0]
        : null;

    initializeCharacter(character);
  }, [selectedModule?.modulePrompt.characters, initializeCharacter]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateModuleField(name as keyof Module, value);
  };

  const handlePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: string
  ) => {
    if (!selectedModule) return;
    const { value } = e.target;
    updateModuleField("modulePrompt", {
      ...selectedModule.modulePrompt,
      [field]: value,
    });
  };

  if (!selectedModule) return null;

  return (
    <div className="h-full overflow-auto space-y-6">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          name="title"
          value={selectedModule.title}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Instructions</label>
        <div className="border rounded-md">
          <MarkdownEditor
            content={selectedModule.instructions || ""}
            onChange={(value) => updateModuleField("instructions", value)}
            className="min-h-[200px]"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">AI Instructions</h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scenario">Scenario</TabsTrigger>
            <TabsTrigger value="moderator">Moderator</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="character">Character</TabsTrigger>
          </TabsList>

          <TabsContent value="scenario" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.scenario}
              onChange={(e) => handlePromptChange(e, "scenario")}
              rows={12}
              placeholder="Enter the scenario instructions..."
            />
          </TabsContent>

          <TabsContent value="moderator" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.moderator || ""}
              onChange={(e) => handlePromptChange(e, "moderator")}
              rows={12}
              placeholder="Enter the moderator instructions..."
            />
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.assessment}
              onChange={(e) => handlePromptChange(e, "assessment")}
              rows={12}
              placeholder="Enter the assessment instructions..."
            />
          </TabsContent>

          <TabsContent value="character" className="mt-4">
            <EditModuleCharacter module={selectedModule} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EditModuleForm;
