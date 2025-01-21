import { Suspense } from "react";
import {
  deleteHistoryEntryAction,
  getHistoryEntryAction,
} from "@/app/actions/history-actions";
import analyseTranscript from "@/app/actions/analyse-transcript";
import { notFound } from "next/navigation";
import { AssessmentContent } from "./assessment-content";
import AssessmentLoading from "./loading";
import { HistoryEntry } from "@/data/history";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { XCircle } from "lucide-react";

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
  if (!historyEntry.transcriptText)
    throw new Error("No transcript found for this assessment");

  const { assessment } = await analyseTranscript(
    historyEntry.transcriptText,
    historyEntry.id,
    historyEntry.moduleId
  );

  return (
    <AssessmentContent
      assessment={assessment}
      transcript={historyEntry.transcript}
    />
  );
}

export default async function AssessmentPage({ params }: Props) {
  const historyId = parseInt(params.assessmentId);
  if (isNaN(historyId)) notFound();

  const historyEntry = await getHistoryEntryAction(historyId);
  if (!historyEntry) notFound();

  if (!historyEntry.transcript) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Empty Transcript</h2>
          </div>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          No transcript generated for this conversation. No assessment can be
          generated.
        </CardContent>
        <CardFooter>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // If assessment already exists, display it
  if (historyEntry.assessmentCreated && historyEntry.assessmentText)
    return (
      <AssessmentContent
        assessment={historyEntry.assessmentText}
        transcript={historyEntry.transcript}
      />
    );

  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentGenerator historyEntry={historyEntry} />
    </Suspense>
  );
}
