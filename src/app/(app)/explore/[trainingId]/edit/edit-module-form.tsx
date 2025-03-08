"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { EditModuleCharacter } from "./edit-module-character";

type Props = {
  module: Module;
};

export function EditModuleForm({ module }: Props) {
  const [activeTab, setActiveTab] = useState<string>("scenario");

  // Use the contexts
  const { updateModuleField, selectModule, selectedModule } = useModuleEdit();

  // Initialize the module in context
  useEffect(() => {
    selectModule(module.id);
  }, [module.id, selectModule]);

  // Add a key to force re-render of the MarkdownEditor when module changes
  const editorKey = `markdown-editor-${selectedModule?.id}-${selectedModule?.title}`;

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
        <label className="text-sm font-medium mb-1 block text-foreground/90">
          Title
        </label>
        <Input
          name="title"
          value={selectedModule.title}
          onChange={handleInputChange}
          className="border-border/50 bg-background/80 focus-visible:ring-primary/20"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block text-foreground/90">
          Instructions
        </label>
        <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
          <MarkdownEditor
            key={editorKey}
            content={selectedModule.instructions || ""}
            onChange={(value) => updateModuleField("instructions", value)}
            className="min-h-[200px]"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 text-foreground">
          AI Instructions
        </h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1">
            <TabsTrigger
              value="scenario"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Scenario
            </TabsTrigger>
            <TabsTrigger
              value="moderator"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Moderator
            </TabsTrigger>
            <TabsTrigger
              value="assessment"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Assessment
            </TabsTrigger>
            <TabsTrigger
              value="character"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Character
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenario" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.scenario}
              onChange={(e) => handlePromptChange(e, "scenario")}
              rows={12}
              placeholder="Enter the scenario instructions..."
              className="border-border/50 bg-background/80 focus-visible:ring-primary/20 resize-none"
            />
          </TabsContent>

          <TabsContent value="moderator" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.moderator || ""}
              onChange={(e) => handlePromptChange(e, "moderator")}
              rows={12}
              placeholder="Enter the moderator instructions..."
              className="border-border/50 bg-background/80 focus-visible:ring-primary/20 resize-none"
            />
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.assessment}
              onChange={(e) => handlePromptChange(e, "assessment")}
              rows={12}
              placeholder="Enter the assessment instructions..."
              className="border-border/50 bg-background/80 focus-visible:ring-primary/20 resize-none"
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
