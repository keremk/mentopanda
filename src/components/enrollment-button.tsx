"use client";

import { Button } from "@/components/ui/button";
import {
  isEnrolledAction,
  enrollInTrainingAction,
  unenrollFromTrainingAction,
} from "@/app/actions/enrollment-actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, LogOut } from "lucide-react";
import { UnenrollConfirmDialog } from "./unenroll-confirm-dialog";
import { logger } from "@/lib/logger";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnrollmentButtonProps {
  trainingId: number;
  className?: string;
  isEnrolled?: boolean;
  variant?: "ghost-brand" | "brand";
  onUnenroll?: (trainingId: number) => void;
  onOptimisticEnrollmentChange?: (enrolled: boolean) => void;
  trainingTitle?: string;
  alwaysShowButtonTitle?: boolean;
}

export function EnrollmentButton({
  trainingId,
  className,
  isEnrolled: initialEnrollmentStatus,
  variant = "ghost-brand",
  onUnenroll,
  onOptimisticEnrollmentChange,
  trainingTitle,
  alwaysShowButtonTitle = true,
}: EnrollmentButtonProps) {
  const [enrolled, setEnrolled] = useState(initialEnrollmentStatus ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

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

  const showText = !isMobile || alwaysShowButtonTitle;

  return (
    <>
      <Button
        variant={enrolled ? "ghost-danger" : variant}
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {enrolled ? (
          <LogOut className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        ) : (
          <PlusIcon className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
        )}
        {showText && (enrolled ? "Leave" : "Join")}
      </Button>

      <UnenrollConfirmDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        trainingTitle={trainingTitle || "this training"}
        onConfirm={handleEnrollment}
        isLoading={isLoading}
      />
    </>
  );
}
