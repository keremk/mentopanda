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
import { Heart } from "lucide-react";

type EmotionsDialogProps = {
  disabled?: boolean;
};

export function EmotionsDialog({ disabled = false }: EmotionsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost-brand"
          disabled={disabled}
        >
          <Heart className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Character Emotions</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Emotional state configuration coming soon...
        </div>
      </DialogContent>
    </Dialog>
  );
}