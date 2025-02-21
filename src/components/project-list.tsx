"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

type ProjectListProps = {
  projects: Array<{ id: number; name: string }>;
  currentProjectId?: number;
  selectedProjectId?: number;
  onProjectSelect: (id: number) => void;
  onCreateNew: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

export function ProjectList({
  projects,
  currentProjectId,
  selectedProjectId,
  onProjectSelect,
  onCreateNew,
  onCancel,
  onConfirm,
  isLoading,
}: ProjectListProps) {
  return (
    <>
      <div className="flex-1 space-y-2 py-6">
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer
                ${
                  project.id === selectedProjectId
                    ? "bg-accent border-accent-foreground/50"
                    : "hover:bg-accent/50"
                }
                ${project.id === currentProjectId ? "border-primary/50" : ""}`}
              onClick={() => onProjectSelect(project.id)}
            >
              <span className="font-medium">{project.name}</span>
              {project.id === currentProjectId && (
                <span className="text-sm text-muted-foreground">Current</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={onCreateNew}>
          Create New
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!selectedProjectId || isLoading}
        >
          {isLoading ? "Switching..." : "Switch to Project"}
        </Button>
      </DialogFooter>
    </>
  );
}
