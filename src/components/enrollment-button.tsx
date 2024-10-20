"use client";

import { Button } from "@/components/ui/button";
import { enrollInTraining, unenrollFromTraining, isEnrolled } from "@/data/enrollments";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PlusCircle, MinusCircle } from "lucide-react";

interface EnrollmentButtonProps {
  trainingId: number;
  className?: string;
}

export function EnrollmentButton({ trainingId, className }: EnrollmentButtonProps) {
  const [enrolled, setEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkEnrollmentStatus();
  }, [trainingId]);

  const checkEnrollmentStatus = async () => {
    try {
      const status = await isEnrolled(supabase, trainingId);
      setEnrolled(status);
    } catch (error) {
      console.error("Failed to check enrollment status:", error);
    }
  };

  const handleEnrollment = async () => {
    setIsLoading(true);
    try {
      if (enrolled) {
        await unenrollFromTraining(supabase, trainingId);
      } else {
        await enrollInTraining(supabase, trainingId);
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
