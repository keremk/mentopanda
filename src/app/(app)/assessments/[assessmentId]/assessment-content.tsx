"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateHistoryEntryAction } from "@/app/actions/history-actions";
import { Response } from "@/components/ai-elements/response";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { useApiKey } from "@/hooks/use-api-key";
import { AlertTriangle, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useThrottledValue } from "@/hooks/use-throttled-value";

type Props = {
  moduleId: number;
  entryId: number;
  assessmentText?: string;
  assessmentCreated?: boolean;
};

const POSTHOG_SURVEY_ID = "0196bb9b-d5bf-0000-7177-095a2c5e4d63";
const POSTHOG_ASSESSMENT_QUESTION_ID = "bfae5267-3ddc-45fa-973f-7c494f4ef775";

export default function AssessmentContent({
  moduleId,
  entryId,
  assessmentText,
  assessmentCreated,
}: Props) {
  const router = useRouter();
  const { apiKey } = useApiKey();
  const posthog = usePostHog();

  const { completion, complete, error } = useCompletion({
    api: "/api/completion",
    body: {
      moduleId: moduleId,
      entryId: entryId,
      apiKey: apiKey,
    },
    onFinish: (_prompt, completionResponse) => {
      updateHistoryEntryAction({
        id: entryId,
        assessmentText: completionResponse,
        assessmentCreated: true,
      });
      // Batch state updates to prevent multiple re-renders
      setIsAssessmentCreated(true);
      setCurrentAssessmentText(completionResponse);
      setFeedbackGiven(null);
      // Refresh server props so future remounts have up-to-date data
      // and do not re-trigger streaming unnecessarily.
      try {
        router.refresh();
      } catch {}
    },
    onError: (err) => {
      logger.error("Error fetching assessment completion:", err);

      // Check if it's a credit error
      const errorMessage = err.message || String(err);
      if (
        errorMessage.includes("No credits available") ||
        errorMessage.includes("402")
      ) {
        logger.info(
          "Credit error detected in assessment, showing NoCreditsDialog"
        );
        setShowNoCreditsDialog(true);
      }
    },
    // Reduce churn from streaming updates; UI also throttles rendering
    experimental_throttle: 150,
  });

  const [hasTriggered, setHasTriggered] = useState(false);
  const [isAssessmentCreated, setIsAssessmentCreated] =
    useState(assessmentCreated);
  const [currentAssessmentText, setCurrentAssessmentText] =
    useState(assessmentText);
  const [feedbackGiven, setFeedbackGiven] = useState<null | "up" | "down">(
    null
  );
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  // Throttle the visible text to avoid jittery re-renders while streaming
  const throttledCompletion = useThrottledValue(completion, 150);

  // Check if there's a credit-related error
  const hasCreditError = useMemo(() => 
    error &&
    (error.message.includes("No credits available") ||
      error.message.includes("402") ||
      showNoCreditsDialog)
  , [error, showNoCreditsDialog]);


  useEffect(() => {
    // Only trigger assessment generation if:
    // 1. Not already triggered
    // 2. Assessment not already created
    // 3. No error occurred
    // 4. Assessment text is not already available (existing assessment)
    if (!hasTriggered && !isAssessmentCreated && !error && !assessmentText) {
      setHasTriggered(true);
      void complete("");
    }
  }, [
    apiKey,
    hasTriggered,
    complete,
    isAssessmentCreated,
    error,
    assessmentText,
  ]);

  const handleFeedback = useCallback(
    (feedback: "up" | "down") => {
      if (!posthog) return;

      const feedbackValue = feedback === "up" ? "ThumbsUp" : "ThumbsDown";

      posthog.capture("survey sent", {
        $survey_id: POSTHOG_SURVEY_ID,
        $survey_questions: [
          {
            id: POSTHOG_ASSESSMENT_QUESTION_ID,
            question: "Was the assessment helpful?",
          },
        ],
        [`$survey_response_${POSTHOG_ASSESSMENT_QUESTION_ID}`]: feedbackValue,
      });
      setFeedbackGiven(feedback);
    },
    [posthog]
  );

  const handleRedoAssessment = useCallback(() => {
    // Reset all states for a fresh assessment generation
    setIsAssessmentCreated(false);
    setCurrentAssessmentText(undefined);
    setHasTriggered(false);
    setFeedbackGiven(null);
    setShowNoCreditsDialog(false);

    // Trigger new assessment generation
    setTimeout(() => {
      void complete("");
    }, 100);
  }, [complete]);

  // Show credit error if there's a credit-related error and no existing assessment
  if (hasCreditError && !currentAssessmentText) {
    return (
      <>
        <div className="my-4 rounded-md border border-danger bg-card p-4 text-sm shadow-md">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-danger"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="font-semibold text-danger">No Credits Available</p>
              <p className="mt-1 text-muted-foreground">
                You don&apos;t have enough credits to generate an assessment.
                Purchase additional credits to continue.
              </p>
            </div>
          </div>
        </div>

        <NoCreditsDialog
          isOpen={showNoCreditsDialog}
          onOpenChange={setShowNoCreditsDialog}
          title="No Credits Available"
          description="You don't have enough credits to generate an assessment. Purchase additional credits to continue using AI features."
        />
      </>
    );
  }

  // Show other errors (non-credit related)
  if (error && !hasCreditError) {
    return (
      <div className="my-4 rounded-md border border-danger bg-card p-4 text-sm shadow-md">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 shrink-0">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-danger">
              Failed to generate assessment
            </p>
            {error.message && (
              <p className="mt-1 text-muted-foreground">
                <em>{error.message}</em>
              </p>
            )}
            {!error.message && (
              <p className="mt-1 text-muted-foreground">
                An unexpected error occurred. Please try again later.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Prefer showing an existing assessment if present.
  // While streaming, use the throttled completion for smoother updates.
  const displayText =
    (throttledCompletion && throttledCompletion.length > 0)
      ? throttledCompletion
      : (currentAssessmentText ?? "");

  return (
    <>
      <div className="space-y-4">
        <div className="prose dark:prose-invert max-w-none">
          <Response parseIncompleteMarkdown={true}>
            {displayText}
          </Response>
        </div>

        {isAssessmentCreated && !error && (
          <div className="mt-6 flex flex-col items-start gap-4 rounded-lg border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Rate this assessment:
            </p>
            <div className="flex w-full items-center justify-end space-x-2 sm:w-auto">
              <Button
                variant={feedbackGiven === "up" ? "default" : "outline"}
                size="icon"
                onClick={() => handleFeedback("up")}
                disabled={feedbackGiven !== null}
                aria-label="Helpful"
              >
                <ThumbsUp
                  className={`h-5 w-5 ${feedbackGiven === "up" ? "" : "text-green-500"}`}
                />
              </Button>
              <Button
                variant={feedbackGiven === "down" ? "destructive" : "outline"}
                size="icon"
                onClick={() => handleFeedback("down")}
                disabled={feedbackGiven !== null}
                aria-label="Not Helpful"
              >
                <ThumbsDown
                  className={`h-5 w-5 ${feedbackGiven === "down" ? "" : "text-red-500"}`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedoAssessment}
                className="ml-auto"
                disabled={hasCreditError}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Redo Assessment
              </Button>
            </div>
          </div>
        )}
      </div>

      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
        title="No Credits Available"
        description="You don't have enough credits to generate an assessment. Purchase additional credits to continue using AI features."
      />
    </>
  );
}
