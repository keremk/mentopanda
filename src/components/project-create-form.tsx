"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type CreateProjectFormProps = {
  onCancel: () => void;
  onSubmit: (data: {
    projectName: string;
    copyStarterContent: boolean;
  }) => void;
  isLoading: boolean;
};

export function ProjectCreateForm({
  onCancel,
  onSubmit,
  isLoading,
}: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("");
  const [copyStarterContent] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 space-y-4 py-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </div>

        {/* <div className="flex items-center space-x-2">
          <Checkbox
            id="copyContent"
            checked={copyStarterContent}
            onCheckedChange={(checked) =>
              setCopyStarterContent(checked as boolean)
            }
          />
          <Label htmlFor="copyContent">
            Copy starter content to new project
          </Label>
        </div> */}
      </div>

      <DialogFooter className="pt-4 border-t">
        <Button type="button" variant="ghost-brand" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="brand"
          disabled={!projectName || isLoading}
          onClick={() => onSubmit({ projectName, copyStarterContent })}
        >
          {isLoading ? "Creating..." : "Create Project"}
        </Button>
      </DialogFooter>
    </div>
  );
}
