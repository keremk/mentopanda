"use client";

import { Button } from "@/components/ui/button";
import {
  isEnrolledAction,
  enrollInTrainingAction,
  unenrollFromTrainingAction,
} from "@/app/actions/enrollment-actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, MinusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";

interface EnrollmentButtonProps {
  trainingId: number;
  className?: string;
  isEnrolled?: boolean;
  variant?: "ghost-brand" | "brand";
  onUnenroll?: (trainingId: number) => void;
  onOptimisticEnrollmentChange?: (enrolled: boolean) => void;
}

export function EnrollmentButton({
  trainingId,
  className,
  isEnrolled: initialEnrollmentStatus,
  variant = "ghost-brand",
  onUnenroll,
  onOptimisticEnrollmentChange,
}: EnrollmentButtonProps) {
  const [enrolled, setEnrolled] = useState(initialEnrollmentStatus ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialEnrollmentStatus !== undefined) {
      setEnrolled(initialEnrollmentStatus);
    } else {
      const checkEnrollmentStatus = async () => {
        try {
          const status = await isEnrolledAction(trainingId);
          setEnrolled(status);
        } catch (error) {
          logger.error("Failed to check enrollment status:", error);
        }
      };
      checkEnrollmentStatus();
    }
  }, [trainingId, initialEnrollmentStatus]);

  const handleEnrollment = async () => {
    const newEnrolledState = !enrolled;

    // Apply optimistic update locally
    setEnrolled(newEnrolledState);
    onOptimisticEnrollmentChange?.(newEnrolledState);

    setIsLoading(true);
    try {
      if (!newEnrolledState) {
        await unenrollFromTrainingAction(trainingId);
        if (onUnenroll) {
          onUnenroll(trainingId);
        }
      } else {
        await enrollInTrainingAction(trainingId);
      }
      router.refresh();
    } catch (error) {
      logger.error("Failed to update enrollment:", error);
      // Revert optimistic update on error
      setEnrolled(!newEnrolledState);
      onOptimisticEnrollmentChange?.(!newEnrolledState);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (enrolled) {
      setIsDialogOpen(true);
    } else {
      handleEnrollment();
    }
  };

  return (
    <>
      <Button
        variant={enrolled ? "ghost-danger" : variant}
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {enrolled ? (
          <MinusIcon className="mr-2 h-4 w-4" />
        ) : (
          <PlusIcon className="mr-2 h-4 w-4" />
        )}
        {enrolled ? "Leave" : "Join"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unenrollment</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this training?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="ghost-danger" onClick={() => handleEnrollment()}>
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
