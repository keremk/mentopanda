import { Suspense } from "react";
import {
  getHistoryEntryAction,
} from "@/app/actions/history-actions";
import analyseTranscript from "@/app/actions/analyse-transcript";
import { notFound } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TranscriptEntry } from "@/types/chat-types";
import { MarkdownRenderer } from "@/components/markdown-renderer";

type Props = {
  params: Promise<{
    assessmentId: string;
  }>;
};

// The helper function produces the common tabs layout.
function PageLayout(assessment: string, transcript?: TranscriptEntry[]) {
  return (
    <div className="container mx-auto py-2">
      <Tabs defaultValue="assessment" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="assessment" className="mt-6">
          <MarkdownRenderer content={assessment} className="mt-6" />;
        </TabsContent>
        <TabsContent value="transcript" className="mt-6">
          {transcript ? (
            <TranscriptDisplay transcriptEntries={transcript} />
          ) : (
            <p className="text-muted-foreground">No transcript available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// When an assessment hasn't been created yet, generate it and render the tabs.
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

  return PageLayout(assessment, historyEntry.transcript);
}

export default async function AssessmentPage(props: Props) {
  const { assessmentId } = await props.params;
  const historyId = parseInt(assessmentId);
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

  // If the assessment already exists, render the tabs using the assessment text.
  if (historyEntry.assessmentCreated && historyEntry.assessmentText) {
    return PageLayout(historyEntry.assessmentText, historyEntry.transcript);
  }

  // Otherwise, generate the assessment and display the tabs.
  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentGenerator historyEntry={historyEntry} />
    </Suspense>
  );
}
