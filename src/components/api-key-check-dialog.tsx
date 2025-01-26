"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { hasStoredApiKey } from "@/lib/apikey";

type ApiKeyCheckDialogProps = {
  isOpenAIModule: boolean;
  isFreePlan: boolean;
};

export function ApiKeyCheckDialog({
  isOpenAIModule,
  isFreePlan,
}: ApiKeyCheckDialogProps) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    async function checkApiKey() {
      if (isOpenAIModule && isFreePlan) {
        const hasApiKey = await hasStoredApiKey();
        setShowDialog(!hasApiKey);
      }
    }

    checkApiKey();
  }, [isOpenAIModule, isFreePlan]);

  return showDialog ? (
    <AlertDialog open={showDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>OpenAI API Key Required</AlertDialogTitle>
          <AlertDialogDescription>
            To use this simulation, you need to add your OpenAI API key in the
            account settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Link href="/settings/account">
            <AlertDialogAction>Go to Account Settings</AlertDialogAction>
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;
}
