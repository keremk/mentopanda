"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { EditModuleCharacter } from "./edit-module-character";
import { useSearchParams } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";

type Props = {
  module: Module;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  moduleTab?: string;
  onModuleTabChange?: (value: string) => void;
};

export function EditModuleForm({
  module,
  isFullScreen,
  onToggleFullScreen,
  moduleTab: externalModuleTab,
  onModuleTabChange,
}: Props) {
  const searchParams = useSearchParams();
  const [localActiveTab, setLocalActiveTab] = useState<string>("scenario");

  // Use the new context hook for dispatching actions
  const { dispatch } = useTrainingEdit();

  // Use external tab state if provided, local state otherwise
  const activeTab = externalModuleTab || localActiveTab;

  // Get initial tab from URL or default to "scenario", but only on first render
  useEffect(() => {
    const tabFromUrl = searchParams.get("moduleTab");
    if (tabFromUrl) {
      setLocalActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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

  const handleQuickTest = () => {
    // Open in a new tab
    window.open(`/simulation/${module.id}`, "_blank");
  };

  // Function to update tab state
  const handleTabChange = (value: string) => {
    setLocalActiveTab(value);
    if (onModuleTabChange) {
      onModuleTabChange(value);
    }
  };

  const handleModuleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      // Global handler in edit-container will still trigger AIPane
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      onToggleFullScreen();
    }
  };

  return (
    <div
      className={`h-full space-y-6 px-2 ${isFullScreen ? "fixed inset-0 z-40 bg-background p-6" : ""}`}
    >
      {!isFullScreen && (
        <>
          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <AIFocusInput
              name="title"
              value={module.title}
              onChange={handleModuleFieldChange}
              placeholder="Enter module title"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
              onKeyDown={handleModuleKeyDown}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Instructions
            </label>
            <AIFocusTextarea
              name="instructions"
              value={module.instructions || ""}
              onChange={handleModuleFieldChange}
              className="min-h-[200px] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
              placeholder="Enter module instructions visible to the user, use markdown for formatting"
              onKeyDown={handleModuleKeyDown}
            />
          </div>
        </>
      )}

      <div
        className={`${isFullScreen ? "mt-0" : "mt-8"} transition-all duration-300 px-2`}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/30 px-2">
          <h3 className="text-lg font-medium text-foreground px-6">
            AI Instructions
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost-brand" onClick={handleQuickTest} size="sm">
              Quick Test
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost-brand"
                  size="icon"
                  onClick={onToggleFullScreen}
                  className="h-8 w-8"
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Fullscreen (⌘F)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex h-full">
          <div className="w-full">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1">
                <TabsTrigger
                  value="scenario"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Scenario
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
                <AIFocusTextarea
                  name="scenario"
                  value={module.modulePrompt.scenario}
                  onChange={(e) => handleModulePromptFieldChange(e, "scenario")}
                  rows={12}
                  placeholder="Enter the prompt for the AI to set up the overall scenario"
                  className={`${isFullScreen ? "min-h-[calc(100vh-10rem)]" : "min-h-[calc(100vh-41rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
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
                  className={`${isFullScreen ? "min-h-[calc(100vh-10rem)]" : "min-h-[calc(100vh-41rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
                  onKeyDown={handleModuleKeyDown}
                />
              </TabsContent>

              <TabsContent value="character" className="mt-4">
                <EditModuleCharacter isFullScreen={isFullScreen} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModuleForm;
