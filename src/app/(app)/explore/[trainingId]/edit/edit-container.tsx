"use client";

import { useState, useEffect } from "react";
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
import {
  TrainingEditProvider,
  useTrainingEdit,
} from "@/contexts/training-edit-context";
import { TrainingEdit } from "@/data/trainings";
import { CharacterSummary } from "@/data/characters";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Prop Types ---
// Ensure this type definition is correct and includes the necessary props
type EditContainerProps = {
  user: User;
  initialTraining: TrainingEdit;
  initialCharacters: CharacterSummary[];
};

// --- Inner Component ---
// Create an inner component to access the context after the provider
function EditContainerContent({ user }: { user: User }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAIPaneOpen, setIsAIPaneOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [moduleTab, setModuleTab] = useState<string>("scenario");
  const { toast } = useToast();

  // Use the context provided by the outer component
  const { state, dispatch, saveNow, getModuleById } = useTrainingEdit();
  const { training, selectedModuleId, isSaving } = state;

  // useEffects and handlers remain largely the same, using state and dispatch from context
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);

    const moduleTabFromUrl = searchParams.get("moduleTab");
    if (moduleTabFromUrl) setModuleTab(moduleTabFromUrl);
  }, [searchParams]);

  const handleTabChange = (value: string) => setActiveTab(value);

  const handleDeleteTraining = async () => {
    if (!training) return;
    try {
      await deleteTrainingAction(training.id);
      router.push("/explore");
    } catch (error) {
      console.error("Error deleting training:", error);
      // Add user feedback
      toast({
        title: "Error deleting training",
        description: "Please try again.",
      });
    }
  };

  const handleSaveAndExit = async () => {
    if (isSaving) return;
    try {
      const saveSuccessful = await saveNow();
      if (saveSuccessful) {
        router.push(`/explore/${training.id}`);
      } else {
        console.error("Save failed before exiting.");
        toast({
          title: "Error saving training",
          description: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error during save and exit:", error);
      toast({
        title: "Error saving training",
        description: "Please try again.",
      });
    }
  };

  const handleToggleAIPane = () => setIsAIPaneOpen((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setIsAIPaneOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const determineContextType = (): ContextType =>
    activeTab === "details" ? "training" : "module";

  const getAIPaneContext = () => {
    const contextType = determineContextType();
    const currentModule = getModuleById(selectedModuleId);
    const currentCharacter = currentModule?.modulePrompt.characters[0];
    return {
      contextType,
      contextData: {
        trainingId: String(training.id),
        moduleId: currentModule ? String(currentModule.id) : undefined,
        characterId: currentCharacter ? String(currentCharacter.id) : undefined,
      },
      onApplyContent: (content: string, targetField: string) => {
        applyGeneratedContent(
          content,
          targetField,
          currentModule?.id,
          currentCharacter?.id
        );
      },
    };
  };

  const applyGeneratedContent = (
    content: string,
    targetField: string,
    currentModuleId: number | undefined,
    currentCharacterId: number | undefined
  ) => {
    if (activeTab === "details") {
      switch (targetField) {
        case "title":
        case "tagline":
        case "description":
          dispatch({
            type: "UPDATE_TRAINING_FIELD",
            payload: { field: targetField, value: content },
          });
          break;
        default:
          console.warn("Unknown targetField for details tab:", targetField);
      }
    } else if (activeTab === "modules" && currentModuleId) {
      switch (targetField) {
        case "title":
        case "instructions":
          dispatch({
            type: "UPDATE_MODULE_FIELD",
            payload: {
              moduleId: currentModuleId,
              field: targetField,
              value: content,
            },
          });
          break;
        case "scenario":
        case "assessment":
          dispatch({
            type: "UPDATE_MODULE_PROMPT_FIELD",
            payload: {
              moduleId: currentModuleId,
              field: targetField,
              value: content,
            },
          });
          break;
        case "characterPrompt":
          if (currentCharacterId) {
            dispatch({
              type: "UPDATE_MODULE_CHARACTER_PROMPT",
              payload: {
                moduleId: currentModuleId,
                characterId: currentCharacterId,
                prompt: content,
              },
            });
          } else {
            console.warn(
              "Cannot apply character prompt: No character selected."
            );
          }
          break;
        default:
          console.warn("Unknown targetField for modules tab:", targetField);
      }
    } else {
      console.warn(
        "Cannot update content: Unknown tab or missing module/character",
        { activeTab, currentModuleId, currentCharacterId }
      );
    }
  };

  const aiPaneContextValue = getAIPaneContext();
  const handleModuleTabChange = (value: string) => setModuleTab(value);

  if (!training) return <div>Loading...</div>; // Should ideally not happen if provider initializes correctly

  return (
    <AIPaneProvider
      contextType={aiPaneContextValue.contextType}
      contextData={aiPaneContextValue.contextData}
      onApplyContent={aiPaneContextValue.onApplyContent}
    >
      <div className="h-full px-4 flex flex-col min-h-[calc(100vh-2rem)] pb-4">
        <ApiKeyCheckDialog isOpenAIModule={true} user={user} />
        <div className="mb-8 absolute top-0 right-0 p-4 z-10 flex gap-3">
          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost-danger"
                disabled={isSaving}
                size="default"
                className="h-9 shadow-sm hover:shadow-md transition-all"
              >
                Delete
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
          {/* Quick Test Button (only show in modules tab and when a module is selected) */}
          {activeTab === "modules" && selectedModuleId && (
            <Button
              variant="ghost-brand"
              onClick={() =>
                window.open(`/simulation/${selectedModuleId}`, "_blank")
              }
              size="default"
              className="h-9"
            >
              Test
            </Button>
          )}
          {/* Save & Exit Button */}
          <Button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            variant="ghost-brand"
            size="default"
            className="h-9"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Exit"
            )}
          </Button>
          {/* AI Pane Toggle Button */}
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

        {/* Main Content Area */}
        <div className="flex w-full h-full mt-8">
          {/* Tabs Area */}
          <div className="flex-1 min-w-0 pr-4">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full flex-1 flex flex-col"
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
                  onModuleTabChange={handleModuleTabChange}
                  moduleTab={moduleTab}
                  isAIPaneOpen={isAIPaneOpen}
                />
              </TabsContent>
            </Tabs>
          </div>
          {/* AI Pane */}
          <div
            className={cn(
              "transition-all duration-300 overflow-hidden flex-shrink-0",
              isAIPaneOpen ? "w-[435px]" : "w-0"
            )}
          >
            <AIPane isOpen={isAIPaneOpen} />
          </div>
        </div>
      </div>
    </AIPaneProvider>
  );
}

// --- Exported Wrapper Component ---
// Ensure this component accepts the correct props matching EditContainerProps
export function EditContainer({
  user,
  initialTraining,
  initialCharacters,
}: EditContainerProps) {
  // Wrap the actual content component with the Provider
  return (
    <TrainingEditProvider
      initialTraining={initialTraining}
      initialCharacters={initialCharacters}
    >
      <EditContainerContent user={user} />
    </TrainingEditProvider>
  );
}
