"use client";

import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useModuleList } from "@/contexts/module-list-context";
import { useModuleEdit } from "@/contexts/module-edit-context";

export function EditModules() {
  const { modules, addModule, deleteModule } = useModuleList();
  const { selectedModuleId, selectModule } = useModuleEdit();

  // This ensures we're always using the most up-to-date module data
  // Instead of relying on the potentially stale selectedModule from context
  const currentModule = selectedModuleId
    ? modules.find((m) => m.id === selectedModuleId)
    : null;

  const handleSelectModule = async (moduleId: number) => {
    // Update the selected module ID in the context
    await selectModule(moduleId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      <div className="w-full md:w-80 h-[calc(100vh-11rem)]">
        <ModuleList
          key={JSON.stringify(modules)}
          modules={modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={handleSelectModule}
          onAddModule={(title) => addModule(title)}
          onDeleteModule={deleteModule}
        />
      </div>
      <div className="flex-1 h-[calc(100vh-12rem)] overflow-auto">
        {currentModule ? (
          <EditModuleForm
            key={`module-${currentModule.id}`}
            module={currentModule}
          />
        ) : (
          <div className="flex items-center justify-center h-full border rounded-lg p-8 bg-muted/10">
            <p className="text-muted-foreground text-center">
              Select a module to edit or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
