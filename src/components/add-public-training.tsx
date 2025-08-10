"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { copyPublicTrainingToProjectAction } from "@/app/actions/trainingActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface AddPublicTrainingProps {
  trainingId: number;
  trainingTitle?: string;
  className?: string;
  isForked?: boolean;
  variant?: "ghost-brand" | "brand";
}

export function AddPublicTraining({
  trainingId,
  trainingTitle,
  className,
  isForked = false,
  variant = "ghost-brand",
}: AddPublicTrainingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleCopy = async () => {
    setIsLoading(true);
    try {
      const result = await copyPublicTrainingToProjectAction(trainingId);
      
      if (result.success) {
        toast({
          title: "Training Added",
          description: `${trainingTitle || "Training"} has been added to your project.`,
        });
        setIsDialogOpen(false);
        router.push(`/explore/${result.trainingId}`);
      }
    } catch (error) {
      logger.error("Failed to copy public training:", error);
      toast({
        title: "Error",
        description: "Failed to add training to your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClick}
        className={className}
      >
        <Plus className="mr-2 h-4 w-4" />
        {isForked ? "Add Again" : "Add to Project"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isForked ? "Re-add Training to Project" : "Add Training to Project"}
            </DialogTitle>
            <DialogDescription>
              {isForked 
                ? `This training has been previously added to your project. Re-adding "${trainingTitle || "this training"}" will create a fresh copy with any recent updates.`
                : `Do you want to copy "${trainingTitle || "this training"}" to your project? This will create a copy that you can customize and manage.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="brand" 
              onClick={handleCopy}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}