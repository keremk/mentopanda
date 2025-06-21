"use client";

import { Button } from "@/components/ui/button";
import { UnenrollConfirmDialog } from "./unenroll-confirm-dialog";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { unenrollFromTrainingAction } from "@/app/actions/enrollment-actions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

type UnenrollButtonProps = {
  trainingId?: number;
  trainingTitle?: string;
  nextTrainingId?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function UnenrollButton({
  trainingId,
  trainingTitle,
  nextTrainingId,
  disabled,
  label = "Remove",
  className,
}: UnenrollButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleUnenroll() {
    if (!trainingId) return;

    setIsLoading(true);
    try {
      await unenrollFromTrainingAction(trainingId);
      setIsOpen(false);

      toast({
        title: "Successfully unenrolled",
        description: `You have been unenrolled from "${trainingTitle}"`,
      });

      // Navigate to next training or main page
      if (nextTrainingId) {
        router.push(`/enrollments/${nextTrainingId}`);
      } else {
        router.push("/enrollments");
      }

      // Force a revalidation of the layout data
      router.refresh();
    } catch (error) {
      toast({
        title: "Failed to unenroll",
        description:
          "An error occurred while trying to unenroll from the training.",
        variant: "destructive",
      });
      logger.error("Failed to unenroll:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost-danger"
        size={className ? undefined : "sm"}
        className={`flex-1 ${className ? `rounded-md px-3 ${className}` : ""}`}
        disabled={disabled || !trainingId || isLoading}
        onClick={() => setIsOpen(true)}
      >
        <LogOut className="h-4 w-4 mr-1" />
        {label}
      </Button>

      <UnenrollConfirmDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trainingTitle={trainingTitle}
        onConfirm={handleUnenroll}
        isLoading={isLoading}
      />
    </>
  );
}
