"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { updateHistoryEntryAction } from "@/app/actions/history-actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { useRouter } from "next/navigation";
import { useApiKey } from "@/hooks/use-api-key";
import { AlertTriangle } from "lucide-react";

type Props = {
  moduleId: number;
  entryId: number;
  assessmentText?: string;
  assessmentCreated?: boolean;
};

export default function AssessmentContent({
  moduleId,
  entryId,
  assessmentText,
  assessmentCreated,
}: Props) {
  const router = useRouter();
  const { apiKey } = useApiKey();

  const { completion, complete, error } = useCompletion({
    api: "/api/completion",
    body: {
      moduleId: moduleId,
      entryId: entryId,
      apiKey: apiKey,
    },
    onFinish: (prompt, completion) => {
      updateHistoryEntryAction({
        id: entryId,
        assessmentText: completion,
        assessmentCreated: true,
      });
      setIsAssessmentCreated(true);
      setCurrentAssessmentText(completion);
      router.refresh();
    },
    onError: (err) => {
      console.error("Error fetching assessment completion:", err);
      // Potentially set an error state here to display a more user-friendly message
    },
    experimental_throttle: 500,
  });

  const [hasTriggered, setHasTriggered] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [isAssessmentCreated, setIsAssessmentCreated] =
    useState(assessmentCreated);
  const [currentAssessmentText, setCurrentAssessmentText] =
    useState(assessmentText);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStreamedContent(completion);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [completion]);

  useEffect(() => {
    if (!hasTriggered && !isAssessmentCreated) {
      setHasTriggered(true);
      void complete("");
    }
  }, [apiKey, hasTriggered, complete, isAssessmentCreated]);

  if (error) {
    return (
      <div className="my-4 rounded-md border border-danger bg-card p-4 text-sm shadow-md">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 flex-shrink-0">
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

  return (
    <div className="prose space-y-2">
      {isAssessmentCreated ? (
        <MemoizedMarkdown content={currentAssessmentText || ""} />
      ) : (
        <MemoizedMarkdown content={streamedContent} />
      )}
    </div>
  );
}
