"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { EditModuleCharacter } from "./edit-module-character";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Props = {
  module: Module;
};

export function EditModuleForm({ module }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the active tab from URL or default to "scenario"
  const activeTab = searchParams.get("moduleTab") || "scenario";

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

  const handleQuickTest = () => {
    if (selectedModule) {
      router.push(`/simulation/${selectedModule.id}`);
    }
  };

  // Function to update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("moduleTab", value);
    router.push(`${pathname}?${params.toString()}`);
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
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/30">
          <h3 className="text-lg font-medium text-foreground">
            AI Instructions
          </h3>
          <Button
            variant="outline"
            onClick={handleQuickTest}
            size="sm"
            className="shadow-sm hover:shadow-md transition-all bg-background/80 border-primary/30 hover:bg-primary/10 text-primary"
          >
            Quick Test
          </Button>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
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
