"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useModuleList } from "@/contexts/module-list-context";
import { useModuleEdit } from "@/contexts/module-edit-context";

type Props = {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
};

export function EditModules({
  isFullScreen,
  onToggleFullScreen,
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

  const handleSelectModule = (moduleId: number) => {
    // Only update if the module ID is different
    if (moduleId === effectiveModuleId) return;

    // Update the context first
    selectModule(moduleId);

    // Update URL without causing a navigation (replace instead of push)
    const params = new URLSearchParams(searchParams);
    params.set("moduleId", moduleId.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Skip if no modules
    if (modules.length === 0) return;

    // Skip if we already have a valid module selected
    if (selectedModuleId && modules.some((m) => m.id === selectedModuleId))
      return;

    // Case 1: URL has moduleId that exists in modules
    if (moduleIdFromUrl) {
      const moduleId = parseInt(moduleIdFromUrl);
      if (modules.some((m) => m.id === moduleId)) {
        selectModule(moduleId);
      } else {
        // If module doesn't exist, select first module
        handleSelectModule(modules[0].id);
      }
    }
    // Case 2: No moduleId in URL but modules exist, select first module
    else if (!effectiveModuleId) {
      handleSelectModule(modules[0].id);
    }
  }, [moduleIdFromUrl, modules]); // Only depend on URL changes and modules list

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full">
      {!isFullScreen && (
        <div className="w-full md:w-80 h-[calc(100vh-11rem)]">
          <ModuleList
            modules={modules}
            selectedModuleId={effectiveModuleId}
            onSelectModule={handleSelectModule}
            onAddModule={(title) => addModule(title)}
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
