"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { AIPaneProvider } from "@/contexts/ai-pane-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function EditContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAIPaneOpen, setIsAIPaneOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get the active tab from URL or default to "details"
  const activeTab = searchParams.get("tab") || "details";

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

  // Function to update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
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

    // Update URL with fullscreen state
    const params = new URLSearchParams(searchParams);
    if (newState) {
      params.set("fullscreen", "true");
    } else {
      params.delete("fullscreen");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [isFullScreen, searchParams, pathname, router]);

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

  return (
    <AIPaneProvider>
      <div className="container h-full px-4 flex flex-col min-h-[calc(100vh-2rem)] pb-4">
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
              />
            </TabsContent>
          </Tabs>
        </div>

        <AIPane isOpen={isAIPaneOpen} onClose={handleToggleAIPane} />
      </div>
    </AIPaneProvider>
  );
}
