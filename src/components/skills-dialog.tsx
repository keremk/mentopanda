"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrainIcon } from "lucide-react";

type SkillsDialogProps = {
  disabled?: boolean;
};

export function SkillsDialog({ disabled = false }: SkillsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost-brand"
          disabled={disabled}
        >
          <BrainIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Character Skills</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Skills configuration coming soon...
        </div>
      </DialogContent>
    </Dialog>
  );
}