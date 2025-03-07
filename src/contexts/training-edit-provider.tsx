"use client";

import { ReactNode } from "react";
import { TrainingEdit } from "@/data/trainings";
import { CharacterSummary } from "@/data/characters";
import { TrainingDetailsProvider } from "./training-details-context";
import { ModuleEditProvider, useModuleEdit } from "./module-edit-context";
import { CharacterPromptProvider } from "./character-prompt-context";
import { ModuleListProvider } from "./module-list-context";

interface TrainingEditProviderProps {
  children: ReactNode;
  initialTraining: TrainingEdit;
  initialCharacters: CharacterSummary[];
}

export function TrainingEditProvider({
  children,
  initialTraining,
  initialCharacters,
}: TrainingEditProviderProps) {
  return (
    <TrainingDetailsProvider initialTraining={initialTraining}>
      <ModuleListProvider
        trainingId={initialTraining.id}
        initialModules={initialTraining.modules}
      >
        <ModuleEditProvider>
          <ModuleEditConsumer>
            {(moduleId, refreshModule) => (
              <CharacterPromptProvider
                moduleId={moduleId}
                characters={initialCharacters}
                refreshModule={refreshModule}
              >
                {children}
              </CharacterPromptProvider>
            )}
          </ModuleEditConsumer>
        </ModuleEditProvider>
      </ModuleListProvider>
    </TrainingDetailsProvider>
  );
}

// Helper component to access module ID from context
function ModuleEditConsumer({
  children,
}: {
  children: (
    moduleId: number | undefined,
    refreshModule: () => Promise<void>
  ) => ReactNode;
}) {
  // Access module context to get selected module ID and refresh function
  const { selectedModuleId, refreshCurrentModule } = useModuleEdit();
  return <>{children(selectedModuleId, refreshCurrentModule)}</>;
}
