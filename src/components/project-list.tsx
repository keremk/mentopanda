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
                    ? "bg-brand/10 border-brand/50"
                    : "hover:bg-brand/5 hover:border-brand/20"
                }
                ${project.id === currentProjectId ? "border-brand/50 ring-1 ring-brand/20" : ""}`}
              onClick={() => onProjectSelect(project.id)}
            >
              <span className="font-medium">{project.name}</span>
              {project.id === currentProjectId && (
                <span className="text-sm text-brand font-medium">Current</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-brand/20">
        <Button type="button" variant="ghost-brand" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="ghost-brand" onClick={onCreateNew}>
          Create New
        </Button>
        <Button
          type="button"
          variant="brand"
          onClick={onConfirm}
          disabled={!selectedProjectId || isLoading}
        >
          {isLoading ? "Switching..." : "Switch to Project"}
        </Button>
      </DialogFooter>
    </>
  );
}
