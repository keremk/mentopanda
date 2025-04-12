"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useTrainingEdit } from "@/contexts/training-edit-context";
// Import server actions needed for direct calls if necessary (e.g., create, delete)
// We'll primarily rely on dispatch and the provider's save logic, but keep actions available
import {
  createModuleAction,
  deleteModuleAction,
} from "@/app/actions/moduleActions";
import { AI_MODELS } from "@/types/models"; // Needed for default module creation

type Props = {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  moduleTab?: string;
  onModuleTabChange?: (value: string) => void;
};

export function EditModules({
  isFullScreen,
  onToggleFullScreen,
  moduleTab = "scenario",
  onModuleTabChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use the centralized context
  const { state, dispatch, getModuleById } = useTrainingEdit();
  const { training, selectedModuleId } = state;
  const modules = training.modules; // Get modules from training state

  // Determine the currently active module based on context's selectedModuleId
  const currentModule = getModuleById(selectedModuleId);

  // --- Simplified handleSelectModule ---
  // Just dispatches the action. URL sync is handled by an effect.
  const handleSelectModule = useCallback(
    (moduleId: number) => {
      if (moduleId !== selectedModuleId) {
        dispatch({ type: "SELECT_MODULE", payload: { moduleId } });
      }
    },
    [selectedModuleId, dispatch]
  );

  // --- handleAddModule (modified return type) ---
  const handleAddModule = useCallback(
    async (title: string): Promise<void> => {
      if (!training) return;
      try {
        const newModule = await createModuleAction(training.id, {
          title: title || "New Module",
          instructions: "",
          ordinal: modules.length,
          modulePrompt: {
            aiModel: AI_MODELS.OPENAI,
            scenario: "",
            assessment: "",
            moderator: "",
            characters: [],
          },
        });
        // Dispatch ADD, the reducer handles setting selectedModuleId
        dispatch({ type: "ADD_MODULE", payload: newModule });
        // The useEffect listening to selectedModuleId will update the URL
      } catch (error) {
        console.error("Error adding module:", error);
      }
    },
    [training, modules.length, dispatch] // Removed handleSelectModule dependency
  );

  // --- handleDeleteModule (keeps direct URL update for now) ---
  const handleDeleteModule = useCallback(
    async (moduleId: number) => {
      if (!training) return false;
      try {
        await deleteModuleAction(moduleId, training.id);
        // Dispatch DELETE, the reducer handles selecting the next/first module
        dispatch({ type: "DELETE_MODULE", payload: { moduleId } });

        // We might still need direct URL manipulation here because the *next* selectedId
        // isn't immediately available after dispatch. The reducer handles the state update,
        // but the effect syncs the *final* state to the URL later.
        // If the deleted module *was* the one in the URL, clear/update the URL param.
        const currentParams = new URLSearchParams(searchParams);
        const currentUrlModuleId = currentParams.get("moduleId");
        if (currentUrlModuleId === moduleId.toString()) {
          // Find the potential next selected module ID *after* deletion
          const remainingModules = training.modules.filter(
            (m) => m.id !== moduleId
          );
          const nextSelectedId = remainingModules[0]?.id;
          if (nextSelectedId) {
            currentParams.set("moduleId", nextSelectedId.toString());
          } else {
            currentParams.delete("moduleId");
          }
          router.replace(`${pathname}?${currentParams.toString()}`, {
            scroll: false,
          });
        }

        return true;
      } catch (error) {
        console.error("Error deleting module:", error);
        return false;
      }
    },
    [training, dispatch, router, pathname, searchParams]
  );

  // --- Effect for Initial Module Selection ---
  useEffect(() => {
    // Only run if modules are loaded and selection isn't already set
    if (modules.length > 0 && selectedModuleId === undefined) {
      const urlModuleIdStr = searchParams.get("moduleId");
      const urlModuleId = urlModuleIdStr ? parseInt(urlModuleIdStr) : null;
      const firstModuleId = modules[0]?.id;
      let initialSelectionId: number | undefined = undefined;

      if (urlModuleId && modules.some((m) => m.id === urlModuleId)) {
        initialSelectionId = urlModuleId;
      } else if (firstModuleId) {
        initialSelectionId = firstModuleId;
      }

      if (initialSelectionId) {
        // Directly dispatch to set the initial state
        dispatch({
          type: "SELECT_MODULE",
          payload: { moduleId: initialSelectionId },
        });
      }
    } else if (modules.length === 0 && selectedModuleId !== undefined) {
      // Clear selection if modules disappear
      dispatch({ type: "SELECT_MODULE", payload: { moduleId: undefined } });
    }
    // Dependencies: Run when modules list loads/changes, or searchParams change initially.
    // Avoid selectedModuleId here to prevent loops with the sync effect.
  }, [modules, searchParams, dispatch]);

  // --- Effect for Syncing Context Selection to URL ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentUrlModuleId = params.get("moduleId");
    const selectedModuleIdStr = selectedModuleId?.toString();

    // If context has a selection different from URL, update URL
    if (
      selectedModuleId !== undefined &&
      currentUrlModuleId !== selectedModuleIdStr
    ) {
      params.set("moduleId", selectedModuleIdStr!);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // If context has no selection but URL does, clear URL param
    else if (selectedModuleId === undefined && currentUrlModuleId !== null) {
      params.delete("moduleId");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedModuleId, searchParams, router, pathname]); // Run when context selection changes

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full">
      {!isFullScreen && (
        <div className="w-full md:w-80 h-[calc(100vh-11rem)]">
          <ModuleList
            modules={modules}
            selectedModuleId={selectedModuleId}
            onSelectModule={handleSelectModule} // Use simplified handler
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
          />
        </div>
      )}
      <div
        className={`${isFullScreen ? "w-full" : "flex-1"} h-[calc(100vh-12rem)] overflow-auto transition-all duration-300`}
      >
        {currentModule ? (
          <EditModuleForm
            key={currentModule.id}
            module={currentModule}
            isFullScreen={isFullScreen}
            onToggleFullScreen={onToggleFullScreen}
            moduleTab={moduleTab}
            onModuleTabChange={onModuleTabChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full border rounded-lg p-8 bg-muted/10">
            <p className="text-muted-foreground text-center">
              {modules.length > 0
                ? "Select a module to edit"
                : "Create a new module to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
