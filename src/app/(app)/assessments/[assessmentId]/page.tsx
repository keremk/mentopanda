import { Suspense } from "react";
import { getHistoryEntryAction } from "../../historyActions";
import analyseTranscript from "@/app/actions/analyse-transcript";
import { notFound } from "next/navigation";
import { AssessmentContent } from "./assessment-content";
import AssessmentLoading from "./loading";
import { HistoryEntry } from "@/data/history";

type Props = {
  params: {
    assessmentId: string;
  };
};

async function AssessmentGenerator({
  historyEntry,
}: {
  historyEntry: HistoryEntry;
}) {
  if (!historyEntry.transcript)
    throw new Error("No transcript found for this assessment");

  const { assessment, score } = await analyseTranscript(
    historyEntry.transcript,
    historyEntry.id,
    historyEntry.moduleId
  );

  return (
    <AssessmentContent
      assessment={assessment}
      transcript={historyEntry.transcript}
      score={score}
    />
  );
}

export default async function AssessmentPage({ params }: Props) {
  const historyId = parseInt(params.assessmentId);
  if (isNaN(historyId)) notFound();

  const historyEntry = await getHistoryEntryAction(historyId);
  if (!historyEntry) notFound();

  // If assessment already exists, display it
  if (historyEntry.assessmentCreated && historyEntry.assessmentText) 
    return (
      <AssessmentContent 
        assessment={historyEntry.assessmentText}
        transcript={historyEntry.transcript}
        score={historyEntry.assessmentScore}
      />
    );

  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentGenerator historyEntry={historyEntry} />
    </Suspense>
  );
}
