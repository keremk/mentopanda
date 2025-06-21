"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface UnenrollConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trainingTitle?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UnenrollConfirmDialog({
  isOpen,
  onOpenChange,
  trainingTitle,
  onConfirm,
  isLoading = false,
}: UnenrollConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[hsl(var(--brand))]">
            Removing Enrollment
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unenroll from {trainingTitle}?
            Removing your enrollment will not remove your progress. It will only
            remove it from your currently enrolled list of trainings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={buttonVariants({ variant: "ghost-brand" })}
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "ghost-danger" })}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Unenrolling..." : "Unenroll"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
