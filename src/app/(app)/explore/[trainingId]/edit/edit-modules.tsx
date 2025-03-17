"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ModuleList } from "@/components/module-list";
import { EditModuleForm } from "./edit-module-form";
import { useModuleList } from "@/contexts/module-list-context";
import { useModuleEdit } from "@/contexts/module-edit-context";

// Define the custom event type
interface ModuleFullscreenChangeEvent extends Event {
  detail: { isFullScreen: boolean };
}

export function EditModules() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFullScreen, setIsFullScreen] = useState(false);

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
    // Update URL with the selected module ID
    const params = new URLSearchParams(searchParams);
    params.set("moduleId", moduleId.toString());

    // Update the context
    selectModule(moduleId);

    // Update the URL
    router.push(`${pathname}?${params.toString()}`);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // Case 1: URL has moduleId that doesn't match context
    if (moduleIdFromUrl && parseInt(moduleIdFromUrl) !== selectedModuleId) {
      const moduleId = parseInt(moduleIdFromUrl);
      // Only update context if module exists (don't update URL)
      if (modules.some((m) => m.id === moduleId)) {
        selectModule(moduleId);
      }
    }
    // Case 2: No moduleId in URL or context, but modules exist
    else if (modules.length > 0 && !effectiveModuleId) {
      const firstModuleId = modules[0].id;
      handleSelectModule(firstModuleId);
    }
  }, [modules, moduleIdFromUrl, selectedModuleId, effectiveModuleId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Listen for fullscreen events from the EditModuleForm component
  useEffect(() => {
    const handleFullScreenChange = (event: ModuleFullscreenChangeEvent) => {
      setIsFullScreen(event.detail.isFullScreen);
    };

    window.addEventListener(
      "module-fullscreen-change",
      handleFullScreenChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "module-fullscreen-change",
        handleFullScreenChange as EventListener
      );
    };
  }, []);

  // Check URL for fullscreen state on initial load and changes
  useEffect(() => {
    const isFullScreenParam = searchParams.get("fullscreen") === "true";
    if (isFullScreenParam !== isFullScreen) {
      setIsFullScreen(isFullScreenParam);
    }
  }, [searchParams, isFullScreen]);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {!isFullScreen && (
        <div className="w-full md:w-80 h-[calc(100vh-11rem)]">
          <ModuleList
            key={JSON.stringify(modules)}
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
