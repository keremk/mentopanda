"use client";

import { useCompletion } from "@ai-sdk/react";  
import { useEffect, useState } from "react";
import { updateHistoryEntryAction } from "@/app/actions/history-actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { useRouter } from "next/navigation";

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
}: Props) 
{
  const router = useRouter();
  const { completion, complete } = useCompletion({
    api: "/api/completion",
    body: {
      moduleId: moduleId,
      entryId: entryId,
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
    experimental_throttle: 500,
  });

  const [hasTriggered, setHasTriggered] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [isAssessmentCreated, setIsAssessmentCreated] = useState(assessmentCreated);
  const [currentAssessmentText, setCurrentAssessmentText] = useState(assessmentText);

  // Update streamed content with a small delay to reduce render frequency
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStreamedContent(completion);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [completion]);

  // Trigger completion once
  useEffect(() => {
    if (!hasTriggered && !isAssessmentCreated) {
      setHasTriggered(true);
      void complete("");
    }
  }, [hasTriggered, complete, isAssessmentCreated]);

  return (
    <div className="prose space-y-2">
      {isAssessmentCreated ? (
        <MemoizedMarkdown
          content={currentAssessmentText || ""}
        />
      ) : (
        <MemoizedMarkdown
          content={streamedContent}
        />
      )}
    </div>
  );
}
