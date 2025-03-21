"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Module } from "@/data/modules";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { EditModuleCharacter } from "./edit-module-character";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  module: Module;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
};

export function EditModuleForm({
  module,
  isFullScreen,
  onToggleFullScreen,
}: Props) {
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

  if (!selectedModule) return null;

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
                <Textarea
                  value={selectedModule.modulePrompt.scenario}
                  onChange={(e) => handlePromptChange(e, "scenario")}
                  rows={12}
                  placeholder="Enter the prompt for the AI to set up the overall scenario"
                  className={`${isFullScreen ? "min-h-[calc(100vh-10rem)]" : "min-h-[calc(100vh-41rem)]"} bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50 transition-all duration-300`}
                />
              </TabsContent>

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
        </div>
      </div>
    </div>
  );
}

export default EditModuleForm;
