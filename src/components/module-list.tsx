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
import { PlusIcon, TrashIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ModuleSummary } from "@/data/modules";

type ModuleListProps = {
  modules: ModuleSummary[];
  selectedModuleId?: number;
  onSelectModule: (moduleId: number) => void;
  onAddModule: (title: string) => Promise<void>;
  onDeleteModule: (moduleId: number) => Promise<boolean>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function ModuleList({
  modules,
  selectedModuleId,
  onSelectModule,
  onAddModule,
  onDeleteModule,
  isCollapsed,
  onToggleCollapse,
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
    <div
      className={`
        flex flex-col
        border border-border/40 bg-background/80 rounded-lg
        overflow-hidden
        transition-all duration-300
        ${isCollapsed ? "w-full md:w-12" : "w-full md:w-80"}
        h-[calc(100vh-11rem)]
      `}
    >
      {/* Header with title and collapse/expand button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-background/90">
        {!isCollapsed && (
          <span className="font-semibold text-base text-foreground">
            Modules
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          aria-label={isCollapsed ? "Expand modules" : "Collapse modules"}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>
      {/* ScrollArea should always be present to show either titles or numbers */}
      <ScrollArea className="flex-1 pt-4">
        <div className={`space-y-2 ${isCollapsed ? "px-1" : "px-4"}`}>
          {modules.map((module, index) => (
            <div
              key={module.id}
              className={`flex items-center justify-center gap-3 rounded-lg py-3 cursor-pointer transition-all duration-200 ${
                module.id === selectedModuleId
                  ? "bg-secondary/90 shadow-sm border border-border/30"
                  : "hover:bg-secondary/50 border border-transparent"
              }`}
              onClick={() => onSelectModule(module.id)}
            >
              <span
                className={`text-sm font-medium ${module.id === selectedModuleId ? "text-foreground" : "text-muted-foreground"}`}
              >
                {isCollapsed ? index + 1 : module.title}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* Only show Add/Remove buttons if not collapsed */}
      {!isCollapsed && (
        <div className="border-t border-border/40 p-3 flex gap-2 bg-background/90">
          {/* Add Module Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost-brand" size="sm" className="flex-1">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newModuleTitle.trim()) {
                    e.preventDefault();
                    handleCreateModule();
                  }
                }}
              />
              <DialogFooter>
                <DialogClose ref={createDialogCloseRef} asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateModule}
                  variant="brand"
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
                variant="ghost-danger"
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
                  variant="danger"
                  onClick={handleDeleteModule}
                  disabled={!selectedModuleId}
                >
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
