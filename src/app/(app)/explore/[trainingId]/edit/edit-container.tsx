"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditTrainingForm } from "./edit-training-form";
import { EditModules } from "./edit-modules";
import { deleteTrainingAction } from "@/app/actions/trainingActions";
import { useTrainingDetails } from "@/contexts/training-details-context";
import { useModuleList } from "@/contexts/module-list-context";
import { useModuleEdit } from "@/contexts/module-edit-context";
import { useCharacterPrompt } from "@/contexts/character-prompt-context";
import { Loader2, Sparkles } from "lucide-react";
import { AIPane } from "@/components/aipane";
import { AIPaneProvider, ContextType } from "@/contexts/ai-pane-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiKeyCheckDialog } from "@/components/api-key-check-dialog";
import { User } from "@/data/user";

type EditContainerProps = {
  user: User;
};

export function EditContainer({ user }: EditContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAIPaneOpen, setIsAIPaneOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [moduleTab, setModuleTab] = useState<string>("scenario");

  // Get initial tab from URL on first render
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }

    const moduleTabFromUrl = searchParams.get("moduleTab");
    if (moduleTabFromUrl) {
      setModuleTab(moduleTabFromUrl);
    }
  }, [searchParams]);

  // Access all contexts for saving
  const trainingDetails = useTrainingDetails();
  const moduleList = useModuleList();
  const moduleEdit = useModuleEdit();
  const characterPrompt = useCharacterPrompt();

  // Initialize fullscreen state from URL params
  useEffect(() => {
    const isFullScreenParam = searchParams.get("fullscreen") === "true";
    setIsFullScreen(isFullScreenParam);
  }, [searchParams]);

  // Function to update tab state without changing URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleDeleteTraining = async () => {
    await deleteTrainingAction(trainingDetails.training.id);
    router.push("/explore");
  };

  const handleSaveAndExit = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Save training details if they've changed
      if (
        trainingDetails.saveStatus === "idle" ||
        trainingDetails.saveStatus === "error"
      ) {
        await trainingDetails.saveTraining();
      }

      // Save current module if it's selected and has changes
      if (
        moduleEdit.selectedModuleId &&
        (moduleEdit.saveStatus === "idle" || moduleEdit.saveStatus === "error")
      ) {
        await moduleEdit.saveModule();
      }

      // Save current character prompt if selected and has changes
      if (
        characterPrompt.selectedCharacterId &&
        (characterPrompt.saveStatus === "idle" ||
          characterPrompt.saveStatus === "error")
      ) {
        await characterPrompt.saveCharacterPrompt();
      }

      // Navigate to training page
      router.push(`/explore/`);
    } catch (error) {
      console.error("Error while saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAIPane = () => {
    setIsAIPaneOpen(!isAIPaneOpen);
  };

  const handleToggleFullScreen = useCallback(() => {
    const newState = !isFullScreen;
    setIsFullScreen(newState);

    // No need to update URL anymore, just use state
  }, [isFullScreen]);

  // Single keyboard shortcut handler for both toggles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if Command/Control is pressed
      if (event.metaKey || event.ctrlKey) {
        const key = event.key.toLowerCase();

        if (key === "k") {
          event.preventDefault();
          setIsAIPaneOpen(!isAIPaneOpen);
        } else if (key === "f") {
          event.preventDefault();
          handleToggleFullScreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAIPaneOpen, handleToggleFullScreen]);

  // Determine if any context is currently saving
  const isAnySaving =
    isSaving ||
    trainingDetails.saveStatus === "saving" ||
    moduleEdit.saveStatus === "saving" ||
    moduleList.saveStatus === "saving" ||
    characterPrompt.saveStatus === "saving";

  // Determine context type and data for AI pane based on active tabs and focused field
  const getAIPaneContext = () => {
    return {
      contextType: determineContextType(),
      contextData: {
        trainingId: String(trainingDetails.training.id),
        moduleId: moduleEdit.selectedModuleId
          ? String(moduleEdit.selectedModuleId)
          : undefined,
        characterId: characterPrompt.selectedCharacterId
          ? String(characterPrompt.selectedCharacterId)
          : undefined,
      },
      onApplyContent: (content: string, targetField: string) => {
        applyGeneratedContent(content, targetField);
      },
    };
  };

  // Determine the context type based on active tab
  const determineContextType = (): ContextType => {
    return activeTab === "details" ? "training" : "module";
  };

  // Apply generated content to the appropriate field
  const applyGeneratedContent = (content: string, targetField: string) => {
    if (activeTab === "details") {
      switch (targetField) {
        case "title":
          trainingDetails.updateTrainingField("title", content);
          break;
        case "tagline":
          trainingDetails.updateTrainingField("tagline", content);
          break;
        case "description":
          trainingDetails.updateTrainingField("description", content);
          break;
        default:
          console.warn("Unknown targetField for details tab:", targetField);
      }
      return;
    }

    if (activeTab === "modules" && moduleEdit.selectedModule) {
      switch (targetField) {
        case "title":
          moduleEdit.updateModuleField("title", content);
          break;
        case "instructions":
          moduleEdit.updateModuleField("instructions", content);
          break;
        case "scenario":
          moduleEdit.updateModuleField("modulePrompt", {
            ...moduleEdit.selectedModule.modulePrompt,
            scenario: content,
          });
          break;
        case "assessment":
          moduleEdit.updateModuleField("modulePrompt", {
            ...moduleEdit.selectedModule.modulePrompt,
            assessment: content,
          });
          break;
        case "characterPrompt":
          characterPrompt.updateCharacterPrompt(content);
          break;
        default:
          console.warn("Unknown targetField for modules tab:", targetField);
      }
      return;
    }

    console.warn("Cannot update content: Unknown tab or missing module", {
      activeTab,
      hasSelectedModule: !!moduleEdit.selectedModule,
    });
  };

  // Use the AIPaneContext properly
  const aiPaneContext = getAIPaneContext();

  // Update the module tab state from child component
  const handleModuleTabChange = (value: string) => {
    setModuleTab(value);
  };

  return (
    <AIPaneProvider
      contextType={aiPaneContext.contextType}
      contextData={aiPaneContext.contextData}
      onApplyContent={aiPaneContext.onApplyContent}
    >
      <div className="container h-full px-4 flex flex-col min-h-[calc(100vh-2rem)] pb-4">
        <ApiKeyCheckDialog isOpenAIModule={true} user={user} />
        <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost-danger"
                disabled={isAnySaving}
                size="default"
                className="h-9 shadow-sm hover:shadow-md transition-all"
              >
                Delete Training
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border/50 bg-background/95 backdrop-blur-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  training and all its modules.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTraining}
                  className="bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={handleSaveAndExit}
            disabled={isAnySaving}
            variant="brand"
            size="default"
            className="h-9"
          >
            {isAnySaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Exit"
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAIPaneOpen ? "brand" : "ghost-brand"}
                size="icon"
                onClick={handleToggleAIPane}
                className="h-9 w-9"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle AI Pane (⌘K)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 mt-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full flex-1 flex flex-col transition-all duration-300"
          >
            <TabsList className="grid w-full grid-cols-2 bg-secondary/30 p-1 rounded-lg border border-border/30">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Training Details
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Modules
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="flex-1 mt-6">
              <EditTrainingForm />
            </TabsContent>
            <TabsContent value="modules" className="flex-1 flex mt-6">
              <EditModules
                isFullScreen={isFullScreen}
                onToggleFullScreen={handleToggleFullScreen}
                onModuleTabChange={handleModuleTabChange}
                moduleTab={moduleTab}
              />
            </TabsContent>
          </Tabs>
        </div>

        <AIPane isOpen={isAIPaneOpen} />
      </div>
    </AIPaneProvider>
  );
}
