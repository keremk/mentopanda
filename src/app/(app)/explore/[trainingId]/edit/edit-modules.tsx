"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useModuleList } from "@/contexts/module-list-context";
import { useModuleEdit } from "@/contexts/module-edit-context";

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

  const { modules, addModule, deleteModule } = useModuleList();
  const { selectedModuleId, selectModule } = useModuleEdit();

  // Get moduleId from URL or context
  const moduleIdFromUrl = searchParams.get("moduleId");
  const effectiveModuleId = moduleIdFromUrl
    ? parseInt(moduleIdFromUrl)
    : selectedModuleId;

  // This ensures we're always using the most up-to-date module data
  const currentModule = effectiveModuleId
    ? modules.find((m) => m.id === effectiveModuleId)
    : null;

  const handleSelectModule = useCallback(
    (moduleId: number) => {
      if (moduleId === effectiveModuleId) return;

      // Step 1: Update context state first
      selectModule(moduleId);

      // Step 2: Update URL using router.replace
      const params = new URLSearchParams(searchParams);
      params.set("moduleId", moduleId.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [selectModule, searchParams, router, pathname, effectiveModuleId]
  );

  useEffect(() => {
    // Skip if no modules
    if (modules.length === 0) return;

    const urlModuleId = moduleIdFromUrl ? parseInt(moduleIdFromUrl) : null;
    const moduleExists = (id: number) => modules.some((m) => m.id === id);

    // Case 1: URL has a moduleId
    if (urlModuleId) {
      if (moduleExists(urlModuleId)) {
        // If URL module exists and isn't selected, select it
        if (urlModuleId !== selectedModuleId) {
          selectModule(urlModuleId);
        }
      } else {
        // If URL module doesn't exist, select the first available module
        handleSelectModule(modules[0].id);
      }
    }
    // Case 2: No moduleId in URL
    else {
      // If no module is currently selected, select the first one
      if (!selectedModuleId && modules.length > 0) {
        handleSelectModule(modules[0].id);
      } else if (selectedModuleId && !moduleExists(selectedModuleId)) {
        // If selected module ID is somehow invalid (not in modules), select first one
        handleSelectModule(modules[0].id);
      }
    }
  }, [
    moduleIdFromUrl,
    modules,
    selectedModuleId,
    selectModule,
    handleSelectModule,
  ]); // Added missing dependencies

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full">
      {!isFullScreen && (
        <div className="w-full md:w-80 h-[calc(100vh-11rem)]">
          <ModuleList
            modules={modules}
            selectedModuleId={effectiveModuleId}
            onSelectModule={handleSelectModule}
            onAddModule={async (title) => {
              const newModule = await addModule(title); // Call context addModule
              if (newModule) {
                handleSelectModule(newModule.id); // Select AFTER creation completes
              }
              // Return value might be needed if ModuleList expected it, but it seems unused
            }}
            onDeleteModule={deleteModule}
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
              Select a module to edit or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
