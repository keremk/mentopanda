"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction } from "@/app/actions/project-actions";
import { useToast } from "@/hooks/use-toast";

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreate?: (project: { id: number; name: string }) => void;
  selectedProjectId?: number;
  onProjectSelect?: (projectId: number) => void;
};

export function ProjectDialog({
  open,
  onOpenChange,
  onProjectCreate,
  selectedProjectId,
  onProjectSelect,
}: ProjectDialogProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name") as string;
      const project = await createProjectAction(name);

      if (onProjectCreate) {
        onProjectCreate(project);
      }
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error(`Error creating project: ${error}`);
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
        <DialogHeader>
          <DialogTitle>
            {view === "list" ? "Select Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "Select an existing project or create a new one."
              : "Create a new project to organize your work."}
          </DialogDescription>
        </DialogHeader>

        {view === "list" ? (
          <div className="flex flex-col" style={{ height: "400px" }}>
            <div className="flex-1 space-y-2 py-6">
              {/* TODO: Replace with actual project list */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors
                    ${
                      selectedProjectId === 1
                        ? "bg-accent border-accent-foreground/50"
                        : "hover:bg-accent/50"
                    }`}
                >
                  <span className="font-medium">Project 1</span>
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors
                    ${
                      selectedProjectId === 2
                        ? "bg-accent border-accent-foreground/50"
                        : "hover:bg-accent/50"
                    }`}
                >
                  <span className="font-medium">Project 2</span>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("create")}
              >
                Create New
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (selectedProjectId && onProjectSelect) {
                    onProjectSelect(selectedProjectId);
                    onOpenChange(false);
                  }
                }}
                disabled={!selectedProjectId}
              >
                Choose
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col" style={{ height: "400px" }}>
              <div className="flex-1 space-y-2 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("list")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
