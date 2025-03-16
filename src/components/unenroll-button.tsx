"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { unenrollFromTrainingAction } from "@/app/actions/enrollment-actions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type UnenrollButtonProps = {
  trainingId?: number;
  trainingTitle?: string;
  nextTrainingId?: number;
  disabled?: boolean;
};

export function UnenrollButton({
  trainingId,
  trainingTitle,
  nextTrainingId,
  disabled,
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
      console.error("Failed to unenroll:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={disabled || !trainingId || isLoading}
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unenroll from training</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unenroll from &quot;{trainingTitle}&quot;?
            This will remove your access to this training and all associated
            progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnenroll} disabled={isLoading}>
            {isLoading ? "Unenrolling..." : "Unenroll"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
