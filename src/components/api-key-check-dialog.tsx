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
import { User } from "@/data/user";

type ApiKeyCheckDialogProps = {
  isOpenAIModule: boolean;
  user: User;
};

export function ApiKeyCheckDialog({
  isOpenAIModule,
  user,
}: ApiKeyCheckDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const isFreePlan = user.pricingPlan === "free";

  useEffect(() => {
    async function checkApiKey() {
      // Only check for API key if it's an OpenAI module and user is on free plan with no active trial
      if (isOpenAIModule && isFreePlan && !hasActiveTrial(user)) {
        const hasApiKey = await hasStoredApiKey();
        setShowDialog(!hasApiKey);
      }
    }

    checkApiKey();
  }, [isOpenAIModule, user, isFreePlan]);

  // Check if user has an active trial
  function hasActiveTrial(user: User): boolean {
    if (!user.trialStartDate || !user.trialEndDate) return false;
    const now = new Date();
    return now >= user.trialStartDate && now <= user.trialEndDate;
  }

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
