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
import { Heart } from "lucide-react";
import { Emotions, createDefaultEmotions } from "@/types/character-attributes";
import { EmotionsEditor } from "@/components/emotions-editor";

type EmotionsDialogProps = {
  disabled?: boolean;
  emotions?: Emotions;
  onSave?: (emotions: Emotions) => void;
  mode?: "training-edit" | "simulation";
};

export function EmotionsDialog({ 
  disabled = false, 
  emotions = createDefaultEmotions(),
  onSave,
  mode = "simulation"
}: EmotionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localEmotions, setLocalEmotions] = useState<Emotions>(emotions);

  const handleSave = () => {
    onSave?.(localEmotions);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalEmotions(emotions); // Reset to original values
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      } else {
        setLocalEmotions(emotions); // Sync with current emotions when opening
        setOpen(newOpen);
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost-brand"
          disabled={disabled}
        >
          <Heart className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "training-edit" ? "Edit Character Emotions" : "Adjust Character Emotions"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <EmotionsEditor
            emotions={localEmotions}
            onChange={setLocalEmotions}
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