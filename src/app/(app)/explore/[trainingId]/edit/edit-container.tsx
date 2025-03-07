"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function EditContainer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [isSaving, setIsSaving] = useState(false);

  // Access all contexts for saving
  const trainingDetails = useTrainingDetails();
  const moduleList = useModuleList();
  const moduleEdit = useModuleEdit();
  const characterPrompt = useCharacterPrompt();

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
      router.push(`/explore/${trainingDetails.training.id}`);
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
    <div className="container mx-auto px-4 flex flex-col min-h-[calc(100vh-2rem)] pb-4">
      <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isAnySaving}>
              Delete Training
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                training and all its modules.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTraining}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          onClick={handleSaveAndExit}
          disabled={isAnySaving}
          variant="outline"
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

      <Tabs
        defaultValue="details"
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col mt-8"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Training Details</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="flex-1">
          <EditTrainingForm />
        </TabsContent>
        <TabsContent value="modules" className="flex-1 flex">
          <EditModules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
