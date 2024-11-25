"use client";

import { Button } from "@/components/ui/button";
import {
  isEnrolledAction,
  enrollInTrainingAction,
  unenrollFromTrainingAction,
} from "@/app/(app)/explore/enrollActions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, MinusCircle } from "lucide-react";
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
  trainingTitle?: string;
}

export function EnrollmentButton({
  trainingId,
  className,
  isEnrolled: initialEnrollmentStatus,
  trainingTitle,
}: EnrollmentButtonProps) {
  const [enrolled, setEnrolled] = useState(initialEnrollmentStatus ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialEnrollmentStatus === undefined) {
      checkEnrollmentStatus();
    }
  }, [trainingId, initialEnrollmentStatus]);

  const checkEnrollmentStatus = async () => {
    try {
      const status = await isEnrolledAction(trainingId);
      setEnrolled(status);
    } catch (error) {
      console.error("Failed to check enrollment status:", error);
    }
  };

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
        variant={enrolled ? "destructive" : "default"}
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {enrolled ? (
          <MinusCircle className="mr-2 h-4 w-4" />
        ) : (
          <PlusCircle className="mr-2 h-4 w-4" />
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
            <Button variant="destructive" onClick={() => handleEnrollment()}>
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
