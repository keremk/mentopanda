"use client";

import { useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Module, ModuleSummary } from "@/data/modules";

type ModuleListProps = {
  modules: ModuleSummary[];
  selectedModuleId?: number;
  onSelectModule: (moduleId: number) => void;
  onAddModule: (title: string) => Promise<Module | null>;
  onDeleteModule: (moduleId: number) => Promise<boolean>;
};

export function ModuleList({
  modules,
  selectedModuleId,
  onSelectModule,
  onAddModule,
  onDeleteModule,
}: ModuleListProps) {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const createDialogCloseRef = useRef<HTMLButtonElement>(null);
  const deleteDialogCloseRef = useRef<HTMLButtonElement>(null);

  const selectedModuleData = modules.find((m) => m.id === selectedModuleId);
  const isModuleSelected = Boolean(selectedModuleId);

  async function handleCreateModule() {
    if (!newModuleTitle.trim()) return;

    await onAddModule(newModuleTitle);

    setNewModuleTitle("");
    createDialogCloseRef.current?.click();
  }

  async function handleDeleteModule() {
    if (!selectedModuleId) return;

    await onDeleteModule(selectedModuleId);
    deleteDialogCloseRef.current?.click();
  }

  return (
    <div className="flex flex-col h-full border border-border/40 bg-background/80 rounded-lg overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 ${
                module.id === selectedModuleId
                  ? "bg-secondary/90 shadow-sm border border-border/30"
                  : "hover:bg-secondary/50 border border-transparent"
              }`}
              onClick={() => onSelectModule(module.id)}
            >
              <span
                className={`text-sm font-medium ${module.id === selectedModuleId ? "text-foreground" : "text-muted-foreground"}`}
              >
                {module.title}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border/40 p-3 flex gap-2 bg-background/90">
        {/* Add Module Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Module</DialogTitle>
              <DialogDescription>
                Enter the title for your new module.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title"
              className="my-4"
            />
            <DialogFooter>
              <DialogClose ref={createDialogCloseRef} asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateModule}
                disabled={!newModuleTitle.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Module Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isModuleSelected}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Module</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedModuleData?.title}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose ref={deleteDialogCloseRef} asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDeleteModule}
                disabled={!selectedModuleId}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
