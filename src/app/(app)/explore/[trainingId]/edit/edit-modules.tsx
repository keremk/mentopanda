"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useTrainingEdit } from "@/contexts/training-edit-context";

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

  // Use the centralized context, including the new methods (addModule, deleteModule)
  const { state, dispatch, getModuleById, addModule, deleteModule } =
    useTrainingEdit(); // Assuming addModule/deleteModule are added to context value
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

  // --- handleAddModule (Refactored) ---
  const handleAddModule = useCallback(
    async (title: string): Promise<void> => {
      // Call the context method to handle creation and state update
      try {
        // Default title logic might be better inside the context method itself
        await addModule(title || "New Module");
        // No dispatch needed here, context handles it internally
        // No URL update needed here, effect handles it
      } catch (error) {
        console.error("Error adding module via context:", error);
        // Optionally show a user-facing error
      }
    },
    [addModule] // Dependency is now the context method
  );

  // --- handleDeleteModule (Refactored) ---
  const handleDeleteModule = useCallback(
    async (moduleId: number): Promise<boolean> => {
      // Call the context method to handle deletion and state update
      try {
        await deleteModule(moduleId);
        // No dispatch needed here, context handles it internally
        // No manual URL update needed here, effect handles it
        return true;
      } catch (error) {
        console.error("Error deleting module via context:", error);
        // Optionally show a user-facing error
        return false;
      }
    },
    [deleteModule] // Dependency is now the context method
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
  }, [modules, searchParams, dispatch, selectedModuleId]);

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
