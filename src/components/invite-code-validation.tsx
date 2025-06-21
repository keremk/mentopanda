"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateInviteCodeWithCookieAction } from "@/app/actions/invite-code-actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { InfoIcon, CheckCircleIcon } from "lucide-react";
import { logger } from "@/lib/logger";
import { WaitlistDialog } from "@/components/waitlist-dialog";

type InviteCodeValidationProps = {
  onValidationSuccess: (inviteCode: string) => void;
};

export function InviteCodeValidation({
  onValidationSuccess,
}: InviteCodeValidationProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const validation = await validateInviteCodeWithCookieAction(
        inviteCode.trim()
      );

      if (validation.isValid) {
        toast({
          title: "Invite code validated!",
          description: "You can now proceed with creating your account.",
        });

        onValidationSuccess(inviteCode.trim());
      } else {
        let errorMessage = "Invalid invite code";

        switch (validation.reason) {
          case "not_found":
            errorMessage = "Invite code not found";
            break;
          case "expired":
            errorMessage = "Invite code has expired";
            break;
          case "already_validated":
            errorMessage = "Invite code has already been used";
            break;
          default:
            errorMessage = validation.message || "Invalid invite code";
        }

        setError(errorMessage);
      }
    } catch (err) {
      logger.info("Error validating invite code", err);
      setError(
        "An error occurred while validating your invite code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-t-4 border-t-brand shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          Welcome to MentoPanda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">
            Enter your invite code to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="inviteCode"
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError(null);
              }}
              className="w-full text-center font-mono"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center p-2 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full btn-brand"
            disabled={isLoading || !inviteCode.trim()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Validate Invite Code
              </>
            )}
          </Button>
        </form>

        <div className="flex items-start gap-2 p-3 rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p>Don&apos;t have an invite code?</p>
            <WaitlistDialog>
              <button className="underline hover:text-brand transition-colors font-medium text-left">
                Join our waiting list
              </button>
            </WaitlistDialog>{" "}
            to get early access.
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login?mode=signin"
              className="underline hover:text-brand transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
