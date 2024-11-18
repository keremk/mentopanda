import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistoryEntryAction } from "../../historyActions";
import analyseTranscript from "@/app/actions/analyse-transcript";
import { notFound } from "next/navigation";
import { AssessmentContent } from "./assessment-content";
import AssessmentLoading from "./loading";

type Props = {
  params: {
    assessmentId: string;
  };
};

async function generateAssessment(historyEntry: {
  id: number;
  transcript: string | null;
  assessmentText: string | null;
}) {
  if (!historyEntry.transcript) 
    throw new Error("No transcript found for this assessment");

  const result = await analyseTranscript(
    historyEntry.transcript,
    historyEntry.id
  );
  return result.assessment;
}

export default async function AssessmentPage({ params }: Props) {
  const historyId = parseInt(params.assessmentId);
  if (isNaN(historyId)) notFound();

  const historyEntry = await getHistoryEntryAction(historyId);
  if (!historyEntry) notFound();

  // If assessment already exists, display it
  if (historyEntry.assessmentText) 
    return (
      <AssessmentContent 
        assessment={historyEntry.assessmentText}
        transcript={historyEntry.transcript}
      />
    );

  // If no assessment exists yet, generate it
  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentContent
        assessment={await generateAssessment(historyEntry)}
        transcript={historyEntry.transcript}
      />
    </Suspense>
  );
}
