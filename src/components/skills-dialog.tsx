"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { BrainIcon } from "lucide-react";
import { Skills, createDefaultSkills } from "@/types/character-attributes";
import { SkillsEditor } from "@/components/skills-editor";

type SkillsDialogProps = {
  disabled?: boolean;
  skills?: Skills;
  onSave?: (skills: Skills) => void;
  mode?: "training-edit" | "simulation";
};

export function SkillsDialog({ 
  disabled = false, 
  skills = createDefaultSkills(),
  onSave,
  mode = "simulation"
}: SkillsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSkills, setLocalSkills] = useState<Skills>(skills);

  const handleSave = () => {
    onSave?.(localSkills);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSkills(skills); // Reset to original values
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      } else {
        setLocalSkills(skills); // Sync with current skills when opening
        setOpen(newOpen);
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost-brand"
          disabled={disabled}
        >
          <BrainIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "training-edit" ? "Edit Character Skills" : "Adjust Character Skills"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <SkillsEditor
            skills={localSkills}
            onChange={setLocalSkills}
            disabled={disabled}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost-brand" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave}>
            {mode === "training-edit" ? "Save" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}