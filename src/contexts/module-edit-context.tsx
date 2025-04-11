"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Module } from "@/data/modules";
import {
  updateModuleAction,
  getModuleByIdAction2,
} from "@/app/actions/moduleActions";
import { useModuleList } from "@/contexts/module-list-context";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ModuleEditContextType = {
  selectedModuleId: number | undefined;
  selectedModule: Module | undefined;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  selectModule: (moduleId: number | undefined) => Promise<void>;
  updateModuleField: <K extends keyof Module>(
    field: K,
    value: Module[K]
  ) => void;
  saveModule: () => Promise<boolean>;
  refreshCurrentModule: () => Promise<void>;
};

const ModuleEditContext = createContext<ModuleEditContextType | undefined>(
  undefined
);

interface ModuleEditProviderProps {
  children: ReactNode;
}

export function ModuleEditProvider({ children }: ModuleEditProviderProps) {
  const { refreshModules, modules } = useModuleList();
  const [selectedModuleId, setSelectedModuleId] = useState<
    number | undefined
  >();
  const [selectedModule, setSelectedModule] = useState<Module | undefined>();
  const [lastSavedModule, setLastSavedModule] = useState<Module | undefined>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [userModified, setUserModified] = useState(false);

  // *** NEW useEffect to sync selectedModule with modules list ***
  useEffect(() => {
    if (!selectedModuleId) {
      // If no ID is selected, ensure module data is also cleared
      if (selectedModule) setSelectedModule(undefined);
      if (lastSavedModule) setLastSavedModule(undefined);
      return;
    }

    // Find the module in the current list
    const moduleFromList = modules.find((m) => m.id === selectedModuleId);

    // If the module exists in the list AND
    // (no module is currently loaded OR the loaded module ID doesn't match)
    if (
      moduleFromList &&
      (!selectedModule || selectedModule.id !== selectedModuleId)
    ) {
      setSelectedModule(moduleFromList);
      setLastSavedModule(structuredClone(moduleFromList));
      setUserModified(false); // Reset modified flag when loading from list
    }
    // Optional: Handle case where selectedModuleId exists but module is NOT in the list?
    // Could happen if module was deleted elsewhere. Maybe clear selectedModuleId?
    // else if (!moduleFromList && selectedModule) {
    //   setSelectedModule(undefined);
    //   setLastSavedModule(undefined);
    // }
  }, [selectedModuleId, modules, selectedModule, lastSavedModule]); // Depend on ID and modules list

  const debouncedModule = useDebounce(selectedModule, 1000);

  // Extracted common save logic
  const performSave = useCallback(
    async (moduleData: Module) => {
      try {
        setSaveStatus("saving");
        const updatedModule = await updateModuleAction({
          id: moduleData.id,
          trainingId: moduleData.trainingId,
          title: moduleData.title,
          instructions: moduleData.instructions,
          ordinal: moduleData.ordinal,
          modulePrompt: moduleData.modulePrompt,
        });

        // Update last saved module to current state
        setLastSavedModule(structuredClone(moduleData));

        // Update the modules list with the latest changes
        refreshModules([updatedModule]);

        setLastSavedAt(new Date());
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      } catch (error) {
        console.error("Error saving module:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return false;
      }
    },
    [refreshModules]
  );

  // Auto-save when module changes
  useEffect(() => {
    // Skip if no module, already saving, no last saved module, or not user modified
    if (
      !debouncedModule ||
      saveStatus !== "idle" ||
      !lastSavedModule ||
      !userModified ||
      debouncedModule.id !== selectedModuleId // Skip if we're in the middle of switching modules
    )
      return;

    // Only save if something changed compared to last saved version
    if (
      JSON.stringify({
        title: lastSavedModule.title,
        instructions: lastSavedModule.instructions,
        ordinal: lastSavedModule.ordinal,
        modulePrompt: lastSavedModule.modulePrompt,
      }) ===
      JSON.stringify({
        title: debouncedModule.title,
        instructions: debouncedModule.instructions,
        ordinal: debouncedModule.ordinal,
        modulePrompt: debouncedModule.modulePrompt,
      })
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      performSave(debouncedModule);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    debouncedModule,
    lastSavedModule,
    saveStatus,
    performSave,
    userModified,
    selectedModuleId,
  ]);

  const selectModule = useCallback(
    async (moduleId: number | undefined) => {
      if (moduleId === selectedModuleId) return;

      setUserModified(false);
      setSelectedModuleId(moduleId);

      // Immediately clear module data; the useEffect above will load it
      setSelectedModule(undefined);
      setLastSavedModule(undefined);
    },
    [selectedModuleId] // Only depends on selectedModuleId now for the initial check
  );

  const updateModuleField = useCallback(
    <K extends keyof Module>(field: K, value: Module[K]) => {
      if (!selectedModule) return;

      // Set the user modified flag when a field is updated
      setUserModified(true);

      setSelectedModule((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });

      setSaveStatus("idle");
    },
    [selectedModule]
  );

  const saveModule = useCallback(async () => {
    if (!selectedModule) return false;
    return performSave(selectedModule);
  }, [selectedModule, performSave]);

  // Add this function to refresh the current module
  const refreshCurrentModule = useCallback(async () => {
    if (!selectedModuleId) return;

    try {
      const trainingModule = await getModuleByIdAction2(selectedModuleId);
      if (trainingModule) {
        setSelectedModule(trainingModule);
        // Also update the module in the module list
        refreshModules([trainingModule]);
        // Reset the user modified flag since we're getting fresh data
        setUserModified(false);
      }
    } catch (error) {
      console.error("Error refreshing module:", error);
    }
  }, [selectedModuleId, refreshModules]);

  return (
    <ModuleEditContext.Provider
      value={{
        selectedModuleId,
        selectedModule,
        saveStatus,
        lastSavedAt,
        selectModule,
        updateModuleField,
        saveModule,
        refreshCurrentModule,
      }}
    >
      {children}
    </ModuleEditContext.Provider>
  );
}

export function useModuleEdit() {
  const context = useContext(ModuleEditContext);
  if (!context) {
    throw new Error("useModuleEdit must be used within a ModuleEditProvider");
  }
  return context;
}
