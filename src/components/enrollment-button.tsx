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

interface EnrollmentButtonProps {
  trainingId: number;
  className?: string;
  isEnrolled?: boolean;
}

export function EnrollmentButton({
  trainingId,
  className,
  isEnrolled: initialEnrollmentStatus,
}: EnrollmentButtonProps) {
  const [enrolled, setEnrolled] = useState(initialEnrollmentStatus ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      try {
        const status = await isEnrolledAction(trainingId);
        setEnrolled(status);
      } catch (error) {
        console.error("Failed to check enrollment status:", error);
      }
    };

    if (initialEnrollmentStatus === undefined) {
      checkEnrollmentStatus();
    }
  }, [trainingId, initialEnrollmentStatus]);

  const handleEnrollment = async () => {
    setIsLoading(true);
    try {
      if (enrolled) {
        await unenrollFromTrainingAction(trainingId);
      } else {
        await enrollInTrainingAction(trainingId);
      }
      setEnrolled(!enrolled);
      router.refresh();
    } catch (error) {
      console.error("Failed to update enrollment:", error);
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
        variant={enrolled ? "ghost-danger" : "outline"}
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
