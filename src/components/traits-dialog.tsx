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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { Traits, createDefaultTraits } from "@/types/character-attributes";
import { TraitsEditor } from "@/components/traits-editor";
import { getCombinedTraitPrompt } from "@/prompts/traits-prompts";

type TraitsDialogProps = {
  disabled?: boolean;
  traits?: Traits;
  onSave?: (traits: Traits) => void;
  mode?: "training-edit" | "simulation";
};

export function TraitsDialog({ 
  disabled = false, 
  traits = createDefaultTraits(),
  onSave,
  mode = "simulation"
}: TraitsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localTraits, setLocalTraits] = useState<Traits>(traits);

  const handleSave = () => {
    onSave?.(localTraits);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalTraits(traits); // Reset to original values
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      } else {
        setLocalTraits(traits); // Sync with current traits when opening
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
            {mode === "training-edit" ? "Edit Character Traits" : "Adjust Character Traits"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="mt-4 h-[calc(80vh-20rem)] overflow-y-auto">
              <TraitsEditor
                traits={localTraits}
                onChange={setLocalTraits}
                disabled={disabled}
              />
            </TabsContent>
            <TabsContent value="prompts" className="mt-4 h-[calc(80vh-20rem)] overflow-y-auto rounded-lg border bg-muted/20 p-4">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Generated Traits Prompt</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {getCombinedTraitPrompt(localTraits).metaPrompt}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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