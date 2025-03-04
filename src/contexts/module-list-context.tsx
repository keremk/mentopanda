"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Module } from "@/data/modules";
import {
  createModuleAction,
  deleteModuleAction,
} from "@/app/actions/moduleActions";
import { AI_MODELS } from "@/types/models";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ModuleListContextType = {
  modules: Module[];
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;

  // Module CRUD operations
  addModule: () => Promise<Module | null>;
  deleteModule: (moduleId: number) => Promise<boolean>;
  refreshModules: (modules: Module[]) => void;
};

const ModuleListContext = createContext<ModuleListContextType | undefined>(
  undefined
);

interface ModuleListProviderProps {
  children: ReactNode;
  trainingId: number;
  initialModules: Module[];
}

export function ModuleListProvider({
  children,
  trainingId,
  initialModules,
}: ModuleListProviderProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Add a new module to the training
  const addModule = useCallback(async () => {
    try {
      setSaveStatus("saving");

      // Create default module with empty content
      const newModule = await createModuleAction(trainingId, {
        title: "New Module",
        instructions: "",
        ordinal: modules.length, // Add to the end of the list
        modulePrompt: {
          aiModel: AI_MODELS.OPENAI,
          scenario: "",
          assessment: "",
          moderator: "",
          characters: [],
        },
      });

      // Update local state with the new module
      setModules((prev) => [...prev, newModule]);

      setLastSavedAt(new Date());
      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 2000);
      return newModule;
    } catch (error) {
      console.error("Error adding module:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return null;
    }
  }, [trainingId, modules.length]);

  // Delete a module from the training
  const deleteModule = useCallback(
    async (moduleId: number) => {
      try {
        setSaveStatus("saving");

        // Delete the module on the server
        await deleteModuleAction(moduleId, trainingId);

        // Remove from local state
        setModules((prev) => prev.filter((m) => m.id !== moduleId));

        // Update ordinals for remaining modules to ensure they're sequential
        const updatedModules = modules
          .filter((m) => m.id !== moduleId)
          .map((m, index) => ({
            ...m,
            ordinal: index,
          }));

        setModules(updatedModules);

        setLastSavedAt(new Date());
        setSaveStatus("saved");

        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      } catch (error) {
        console.error("Error deleting module:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return false;
      }
    },
    [trainingId, modules]
  );

  // Update the local modules list when the training changes
  const refreshModules = useCallback((updatedModules: Module[]) => {
    setModules(updatedModules);
  }, []);

  return (
    <ModuleListContext.Provider
      value={{
        modules,
        saveStatus,
        lastSavedAt,
        addModule,
        deleteModule,
        refreshModules,
      }}
    >
      {children}
    </ModuleListContext.Provider>
  );
}

export function useModuleList() {
  const context = useContext(ModuleListContext);
  if (!context) {
    throw new Error("useModuleList must be used within a ModuleListProvider");
  }
  return context;
}
