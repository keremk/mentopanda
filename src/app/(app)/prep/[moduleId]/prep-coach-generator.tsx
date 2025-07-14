"use client";

import { useEffect, useState, useCallback } from "react";
import { generatePrepCoachAction } from "@/app/actions/moduleActions";
import { PrepCoach } from "./prep-coach";
import { Button } from "@/components/ui/button";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

type PrepCoachGeneratorProps = {
  moduleId: number;
  scenario: string;
  characterPrompts: string[];
};

type GenerationStatus = "idle" | "generating" | "generated" | "error";

export function PrepCoachGenerator({
  moduleId,
  scenario,
  characterPrompts,
}: PrepCoachGeneratorProps) {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  const generatePrepCoach = useCallback(async () => {
    setStatus("generating");
    setError("");
    setShowNoCreditsDialog(false);

    try {
      const result = await generatePrepCoachAction(
        moduleId,
        scenario,
        characterPrompts
      );
      setGeneratedContent(result);
      setStatus("generated");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate prep coach";
      setError(errorMessage);
      setStatus("error");

      // Check for credit-related errors
      if (errorMessage.includes("No credits available")) {
        logger.info(
          "Credit error detected in prep coach generation, showing NoCreditsDialog"
        );
        setShowNoCreditsDialog(true);
      }
    }
  }, [moduleId, scenario, characterPrompts]);

  // Auto-trigger generation on mount
  useEffect(() => {
    generatePrepCoach();
  }, [generatePrepCoach]);

  // Check if current error is credit-related
  const isCreditError = error.includes("No credits available");

  // Loading state
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-brand mb-2">
            Preparing your training coach...
          </h2>
          <p className="text-muted-foreground">
            We&apos;re analyzing your scenario and creating a personalized
            coaching experience.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    logger.error("Error generating prep coach:", error);
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Generation Failed
            </h2>
            {/* Show error message only if it's not a credit error (credit errors show in dialog) */}
            {!isCreditError && (
              <p className="text-muted-foreground mb-4">{error}</p>
            )}
            <Button onClick={generatePrepCoach} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>

        {/* No Credits Dialog */}
        <NoCreditsDialog
          isOpen={showNoCreditsDialog}
          onOpenChange={setShowNoCreditsDialog}
          title="No Credits Available"
          description="You don't have enough credits to generate prep coach content. Purchase additional credits to continue using AI features."
        />
      </>
    );
  }

  // Success state - render the PrepCoach component
  if (status === "generated") {
    return (
      <PrepCoach
        moduleId={moduleId.toString()}
        prepCoachPrompt={generatedContent}
      />
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
