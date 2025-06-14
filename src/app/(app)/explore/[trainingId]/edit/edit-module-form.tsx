"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { EditModuleCharacter } from "./edit-module-character";
import { useSearchParams } from "next/navigation";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";

type Props = {
  module: Module;
  moduleTab?: string;
  onModuleTabChange?: (value: string) => void;
};

export function EditModuleForm({
  module,
  moduleTab: externalModuleTab,
  onModuleTabChange,
}: Props) {
  const searchParams = useSearchParams();
  const [localActiveTab, setLocalActiveTab] = useState<string>("scenario");

  // Use the new context hook for dispatching actions
  const { dispatch } = useTrainingEdit();

  // Determine the active tab - use external if provided, otherwise local
  const activeTab = externalModuleTab || localActiveTab;

  // Get initial tab from URL or default to "scenario", but only on first render
  useEffect(() => {
    const tabFromUrl = searchParams.get("moduleTab");
    if (tabFromUrl) {
      if (onModuleTabChange) {
        onModuleTabChange(tabFromUrl);
      } else {
        setLocalActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, onModuleTabChange]);

  // Handle changes to direct module fields (title, instructions, etc.)
  const handleModuleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Dispatch action to update the specific module field
    dispatch({
      type: "UPDATE_MODULE_FIELD",
      payload: {
        moduleId: module.id, // Use ID from prop
        field: name as keyof Module, // Assert type
        value: value,
      },
    });
  };

  // Handle changes to nested modulePrompt fields (scenario, assessment)
  const handleModulePromptFieldChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: "scenario" | "assessment" // Be specific
  ) => {
    const { value } = e.target;
    // Dispatch action to update the specific module prompt field
    dispatch({
      type: "UPDATE_MODULE_PROMPT_FIELD",
      payload: {
        moduleId: module.id, // Use ID from prop
        field: field,
        value: value,
      },
    });
  };

  // Function to update tab state
  const handleTabChange = (value: string) => {
    if (onModuleTabChange) {
      // If we have a parent callback, use it (controlled mode)
      onModuleTabChange(value);
    } else {
      // Otherwise update local state (uncontrolled mode)
      setLocalActiveTab(value);
    }
  };

  const handleModuleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      // Global handler in edit-container will still trigger AIPane
    }
  };

  return (
    <div className="h-full space-y-6 px-2">
      <div className="flex flex-col gap-y-2 px-2">
        <label className="text-sm font-medium text-muted-foreground">
          Title
        </label>
        <AIFocusInput
          name="title"
          value={module.title}
          onChange={handleModuleFieldChange}
          placeholder="Enter module title"
          className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50 max-w-2xl"
          onKeyDown={handleModuleKeyDown}
        />
      </div>

      <div className="mt-8 transition-all duration-300 px-2">
        <div className="flex h-full">
          <div className="w-full">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 rounded-2xl">
                <TabsTrigger
                  value="instructions"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-2xl focus:ring-brand focus:ring-2"
                >
                  User Instructions
                </TabsTrigger>
                <TabsTrigger
                  value="scenario"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-2xl focus:ring-brand focus:ring-2"
                >
                  Scenario
                </TabsTrigger>
                <TabsTrigger
                  value="character"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-2xl focus:ring-brand focus:ring-2"
                >
                  Character
                </TabsTrigger>
                <TabsTrigger
                  value="assessment"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-2xl focus:ring-brand focus:ring-2"
                >
                  Assessment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="instructions" className="mt-4">
                <AIFocusTextarea
                  name="instructions"
                  value={module.instructions || ""}
                  onChange={handleModuleFieldChange}
                  className="min-h-[calc(100vh-23rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300"
                  placeholder="Enter module instructions visible to the user, use markdown for formatting"
                  onKeyDown={handleModuleKeyDown}
                />
              </TabsContent>

              <TabsContent value="scenario" className="mt-4">
                <AIFocusTextarea
                  name="scenario"
                  value={module.modulePrompt.scenario}
                  onChange={(e) => handleModulePromptFieldChange(e, "scenario")}
                  rows={12}
                  placeholder="Enter the prompt for the AI to set up the overall scenario"
                  className="min-h-[calc(100vh-23rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300"
                  onKeyDown={handleModuleKeyDown}
                />
              </TabsContent>

              <TabsContent value="assessment" className="mt-4">
                <AIFocusTextarea
                  name="assessment"
                  value={module.modulePrompt.assessment}
                  onChange={(e) =>
                    handleModulePromptFieldChange(e, "assessment")
                  }
                  rows={12}
                  placeholder="Enter the prompt for the AI to assess the user's performance"
                  className="min-h-[calc(100vh-23rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300"
                  onKeyDown={handleModuleKeyDown}
                />
              </TabsContent>

              <TabsContent value="character" className="mt-4">
                <EditModuleCharacter />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModuleForm;
