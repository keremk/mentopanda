"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { EnrollmentButton } from "@/components/enrollment-button";

type TrainingActionsRowProps = {
  trainingId: number;
  initialIsEnrolled: boolean;
  enrollmentButtonVariant?: "ghost-brand" | "brand";
  enrollmentButtonClassName?: string;
  trainButtonClassName?: string;
  trainButtonText?: string;
  enrollButtonText?: string;
  unenrollButtonText?: string;
};

export function TrainingActionsRow({
  trainingId,
  initialIsEnrolled,
  enrollmentButtonVariant = "brand",
  enrollmentButtonClassName,
  trainButtonClassName,
}: TrainingActionsRowProps) {
  const [isOptimisticallyEnrolled, setIsOptimisticallyEnrolled] =
    useState(initialIsEnrolled);

  useEffect(() => {
    setIsOptimisticallyEnrolled(initialIsEnrolled);
  }, [initialIsEnrolled]);

  const handleEnrollmentChange = (newEnrolledState: boolean) => {
    setIsOptimisticallyEnrolled(newEnrolledState);
  };

  return (
    <>
      <EnrollmentButton
        trainingId={trainingId}
        isEnrolled={initialIsEnrolled}
        onOptimisticEnrollmentChange={handleEnrollmentChange}
        variant={enrollmentButtonVariant}
        className={enrollmentButtonClassName}
      />
      {isOptimisticallyEnrolled && (
        <Button asChild variant="brand" className={trainButtonClassName}>
          <Link href={`/enrollments/${trainingId}`}>
            <PlayIcon className="mr-2 h-4 w-4" />
            Train
          </Link>
        </Button>
      )}
    </>
  );
}
