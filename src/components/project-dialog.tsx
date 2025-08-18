"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectList } from "./project-list";
import { ProjectCreateForm } from "./project-create-form";
import { useRouter } from "next/navigation";
import {
  setupProjectAction,
  switchToProjectAction,
  getProjectsAction,
} from "@/app/actions/project-actions";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectId?: number;
};

export function ProjectDialog({
  open,
  onOpenChange,
  currentProjectId,
}: ProjectDialogProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(currentProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setView("list");
      getProjectsAction().then(setProjects);
    }
  }, [open]);

  async function handleProjectSwitch() {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      await switchToProjectAction(selectedProjectId);
      onOpenChange(false);
      router.refresh();
      toast({
        title: "Success",
        description: "Switched to selected project",
      });
    } catch (error) {
      logger.error("Error switching projects", error);
      toast({
        title: "Error",
        description: "Failed to switch projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProjectSetup({
    projectName,
    copyStarterContent,
  }: {
    projectName: string;
    copyStarterContent: boolean;
  }) {
    setIsLoading(true);
    try {
      await setupProjectAction({ projectName, copyStarterContent });
      onOpenChange(false);
      router.refresh();
      toast({
        title: "Success",
        description: "Project created and switched successfully",
      });
    } catch (error) {
      logger.error("Error creating project", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="border-b border-border">
          <DialogTitle className="text-brand">
            {view === "list" ? "Select Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "Select an existing project or create a new one."
              : "Create a new project to organize your work."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[400px]">
          {view === "list" ? (
            <ProjectList
              projects={projects}
              currentProjectId={currentProjectId}
              selectedProjectId={selectedProjectId}
              onProjectSelect={setSelectedProjectId}
              onCreateNew={() => setView("create")}
              onCancel={() => onOpenChange(false)}
              onConfirm={handleProjectSwitch}
              isLoading={isLoading}
            />
          ) : (
            <ProjectCreateForm
              onCancel={() => setView("list")}
              onSubmit={handleProjectSetup}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
