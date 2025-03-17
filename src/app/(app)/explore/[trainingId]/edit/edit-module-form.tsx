"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Module } from "@/data/modules";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { EditModuleCharacter } from "./edit-module-character";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";

// Define the custom event type
interface ModuleFullscreenChangeDetail {
  isFullScreen: boolean;
}

type Props = {
  module: Module;
};

export function EditModuleForm({ module }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get the active tab from URL or default to "scenario"
  const activeTab = searchParams.get("moduleTab") || "scenario";

  // Use the contexts
  const { updateModuleField, selectModule, selectedModule } = useModuleEdit();

  // Initialize the module in context
  useEffect(() => {
    selectModule(module.id);
  }, [module.id, selectModule]);

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
      // Open in a new tab
      window.open(`/simulation/${selectedModule.id}`, "_blank");
    }
  };

  // Function to update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("moduleTab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleFullScreen = () => {
    const newState = !isFullScreen;
    setIsFullScreen(newState);

    // Update URL with fullscreen state
    const params = new URLSearchParams(searchParams);
    if (newState) {
      params.set("fullscreen", "true");
    } else {
      params.delete("fullscreen");
    }
    router.push(`${pathname}?${params.toString()}`);

    // Dispatch custom event for parent components to listen to
    const event = new CustomEvent<ModuleFullscreenChangeDetail>(
      "module-fullscreen-change",
      {
        detail: { isFullScreen: newState },
      }
    );
    window.dispatchEvent(event);
  };

  // Check URL for fullscreen state on initial load
  useEffect(() => {
    const isFullScreenParam = searchParams.get("fullscreen") === "true";
    if (isFullScreenParam !== isFullScreen) {
      setIsFullScreen(isFullScreenParam);

      // Dispatch event to notify parent components
      const event = new CustomEvent<ModuleFullscreenChangeDetail>(
        "module-fullscreen-change",
        {
          detail: { isFullScreen: isFullScreenParam },
        }
      );
      window.dispatchEvent(event);
    }
  }, [searchParams, isFullScreen]);

  if (!selectedModule) return null;

  return (
    <div
      className={`h-full space-y-6 px-2 ${isFullScreen ? "fixed inset-0 z-50 bg-background p-6" : ""}`}
    >
      {!isFullScreen && (
        <>
          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <Input
              name="title"
              value={selectedModule.title}
              onChange={handleInputChange}
              placeholder="Enter module title"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Instructions
            </label>
            <Textarea
              name="instructions"
              value={selectedModule.instructions || ""}
              onChange={(e) =>
                updateModuleField("instructions", e.target.value)
              }
              className="min-h-[200px] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
              placeholder="Enter module instructions visible to the user, use markdown for formatting"
            />
          </div>
        </>
      )}

      <div
        className={`${isFullScreen ? "mt-0" : "mt-8"} transition-all duration-300`}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/30">
          <h3 className="text-lg font-medium text-foreground">
            AI Instructions
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost-brand" onClick={handleQuickTest} size="sm">
              Quick Test
            </Button>
            <Button
              variant="ghost-brand"
              size="icon"
              onClick={toggleFullScreen}
              className="h-8 w-8"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
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
            {/* <TabsTrigger
              value="moderator"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Moderator
            </TabsTrigger> */}
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
              placeholder="Enter the prompt for the AI to set up the overall scenario"
              className={`${isFullScreen ? "min-h-[calc(100vh-10rem)]" : "min-h-[calc(100vh-41rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
            />
          </TabsContent>

          {/* <TabsContent value="moderator" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.moderator || ""}
              onChange={(e) => handlePromptChange(e, "moderator")}
              rows={12}
              placeholder="Enter the moderator instructions..."
              className="min-h-[calc(100vh-41rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base"
            />
          </TabsContent> */}

          <TabsContent value="assessment" className="mt-4">
            <Textarea
              value={selectedModule.modulePrompt.assessment}
              onChange={(e) => handlePromptChange(e, "assessment")}
              rows={12}
              placeholder="Enter the prompt for the AI to assess the user's performance"
              className={`${isFullScreen ? "min-h-[calc(100vh-10rem)]" : "min-h-[calc(100vh-41rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
            />
          </TabsContent>

          <TabsContent value="character" className="mt-4">
            <EditModuleCharacter isFullScreen={isFullScreen} />
          </TabsContent>
        </Tabs>
      </div>

      {isFullScreen && (
        <div className="fixed bottom-6 right-6">
          <Button
            variant="brand"
            size="sm"
            onClick={toggleFullScreen}
            className="shadow-lg"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Full Screen
          </Button>
        </div>
      )}
    </div>
  );
}

export default EditModuleForm;
