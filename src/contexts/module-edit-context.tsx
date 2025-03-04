"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Module } from "@/data/modules";
import {
  updateModuleAction,
  getModuleByIdAction2,
} from "@/app/actions/moduleActions";

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
};

const ModuleEditContext = createContext<ModuleEditContextType | undefined>(
  undefined
);

interface ModuleEditProviderProps {
  children: ReactNode;
  trainingId: number;
}

export function ModuleEditProvider({
  children,
  trainingId,
}: ModuleEditProviderProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<
    number | undefined
  >();
  const [selectedModule, setSelectedModule] = useState<Module | undefined>();
  const [lastSavedModule, setLastSavedModule] = useState<Module | undefined>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const debouncedModule = useDebounce(selectedModule, 1000);

  // Extracted common save logic
  const performSave = useCallback(async (moduleData: Module) => {
    try {
      setSaveStatus("saving");
      await updateModuleAction({
        id: moduleData.id,
        trainingId: moduleData.trainingId,
        title: moduleData.title,
        instructions: moduleData.instructions,
        ordinal: moduleData.ordinal,
        modulePrompt: moduleData.modulePrompt,
      });

      // Update last saved module to current state
      setLastSavedModule(structuredClone(moduleData));

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
  }, []);

  // Auto-save when module changes
  useDebounce(async () => {
    if (!debouncedModule || saveStatus !== "idle" || !lastSavedModule) return;

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

    await performSave(debouncedModule);
  }, 1500);

  const selectModule = useCallback(
    async (moduleId: number | undefined) => {
      if (moduleId === selectedModuleId) return;

      setSelectedModuleId(moduleId);

      if (!moduleId) {
        setSelectedModule(undefined);
        setLastSavedModule(undefined);
        return;
      }

      try {
        const module = await getModuleByIdAction2(moduleId);
        if (module) {
          setSelectedModule(module);
          // Initialize last saved module with the fetched data
          setLastSavedModule(structuredClone(module));
        }
      } catch (error) {
        console.error("Error loading module:", error);
      }
    },
    [selectedModuleId]
  );

  const updateModuleField = useCallback(
    <K extends keyof Module>(field: K, value: Module[K]) => {
      if (!selectedModule) return;

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
