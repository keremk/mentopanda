"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CreateOrgDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrgDialog({
  isOpen,
  onOpenChange,
}: CreateOrgDialogProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  function handleRedirect() {
    setIsRedirecting(true);
    router.push("/settings/account");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organization Required</DialogTitle>
          <DialogDescription>
            You need to create an organization before you can create trainings.
            Would you like to do this now?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRedirect} disabled={isRedirecting}>
            {isRedirecting ? "Redirecting..." : "Create Organization"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
