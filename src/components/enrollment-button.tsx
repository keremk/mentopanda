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
  const [enrolled, setEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialEnrollmentStatus !== undefined) {
      setEnrolled(initialEnrollmentStatus);
    } else {
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
    }
  };

  return (
    <Button
      variant={enrolled ? "destructive" : "default"}
      onClick={handleEnrollment}
      className={className}
      disabled={isLoading}
    >
      {enrolled ? (
        <MinusCircle className="mr-2 h-4 w-4" />
      ) : (
        <PlusCircle className="mr-2 h-4 w-4" />
      )}
      {enrolled ? "Unenroll" : "Enroll"}
    </Button>
  );
}
