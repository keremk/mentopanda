"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

// Define the custom event type
interface ModuleFullscreenChangeEvent extends Event {
  detail: { isFullScreen: boolean };
}

export function EditContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get the active tab from URL or default to "details"
  const activeTab = searchParams.get("tab") || "details";

  // Access all contexts for saving
  const trainingDetails = useTrainingDetails();
  const moduleList = useModuleList();
  const moduleEdit = useModuleEdit();
  const characterPrompt = useCharacterPrompt();

  // Listen for fullscreen events from the EditModuleForm component
  useEffect(() => {
    const handleFullScreenChange = (event: ModuleFullscreenChangeEvent) => {
      setIsFullScreen(event.detail.isFullScreen);
    };

    window.addEventListener(
      "module-fullscreen-change",
      handleFullScreenChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "module-fullscreen-change",
        handleFullScreenChange as EventListener
      );
    };
  }, []);

  // Check URL for fullscreen state on initial load and changes
  useEffect(() => {
    const isFullScreenParam = searchParams.get("fullscreen") === "true";
    if (isFullScreenParam !== isFullScreen) {
      setIsFullScreen(isFullScreenParam);
    }
  }, [searchParams, isFullScreen]);

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

  // Determine if any context is currently saving
  const isAnySaving =
    isSaving ||
    trainingDetails.saveStatus === "saving" ||
    moduleEdit.saveStatus === "saving" ||
    moduleList.saveStatus === "saving" ||
    characterPrompt.saveStatus === "saving";

  return (
    <div className="container h-full px-4 flex flex-col min-h-[calc(100vh-2rem)] pb-4">
      {!isFullScreen && (
        <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost-danger"
                disabled={isAnySaving}
                className="shadow-sm hover:shadow-md transition-all"
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
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className={`w-full flex-1 flex flex-col ${isFullScreen ? "mt-0" : "mt-8"} transition-all duration-300`}
      >
        {!isFullScreen && (
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
        )}
        <TabsContent value="details" className="flex-1 mt-6">
          <EditTrainingForm />
        </TabsContent>
        <TabsContent value="modules" className="flex-1 flex mt-6">
          <EditModules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
