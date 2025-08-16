"use client";

import { useState } from "react";
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
import { Loader2, Globe, Lock } from "lucide-react";

interface PublishToggleButtonProps {
  isPublic: boolean;
  forkCount: number;
  onToggle: (newStatus: boolean) => Promise<void>;
  disabled?: boolean;
}

export function PublishToggleButton({
  isPublic,
  forkCount,
  onToggle,
  disabled = false,
}: PublishToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(!isPublic);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isPublic ? "Make Private" : "Make Public";
  const Icon = isPublic ? Lock : Globe;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost-brand"
          disabled={disabled || isLoading}
          size="default"
          className="h-9 shadow-xs hover:shadow-md transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPublic ? "Making Private..." : "Making Public..."}
            </>
          ) : (
            <>
              <Icon className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border/50 bg-background/95 backdrop-blur-xs">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublic ? "Make Training Private?" : "Make Training Public?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublic ? (
              <>
                This training is currently public and has been forked{" "}
                <strong>{forkCount} time{forkCount !== 1 ? "s" : ""}</strong>.
                Making it private will remove it from the public training
                library, but existing forks will remain accessible to their
                owners.
              </>
            ) : (
              <>
                This will make your training visible to everyone in the public
                training library. Other users will be able to view and fork
                (copy) your training to their own projects.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            className={
              isPublic
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs"
                : "bg-brand text-brand-foreground hover:bg-brand-hover shadow-xs"
            }
          >
            {isPublic ? "Make Private" : "Make Public"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}