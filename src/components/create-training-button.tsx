"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { CreateOrgDialog } from "@/components/dialogs/create-org-dialog";
import { createTrainingAction } from "@/app/(app)/trainingActions";

type CreateTrainingButtonProps = {
  needsOrganization: boolean;
};

export function CreateTrainingButton({
  needsOrganization,
}: CreateTrainingButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {needsOrganization ? (
        // If needs organization, show button that opens dialog
        <Button
          onClick={() => setShowDialog(true)}
          variant="outline"
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Training
        </Button>
      ) : (
        // If has organization, show form with server action
        <Button
          onClick={() => startTransition(() => createTrainingAction())}
          disabled={isPending}
          variant="outline"
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isPending ? "Creating..." : "Create Training"}
        </Button>
      )}

      <CreateOrgDialog isOpen={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
