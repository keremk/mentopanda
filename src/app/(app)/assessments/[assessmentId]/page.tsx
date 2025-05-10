import { Suspense } from "react";
import { getHistoryEntryAction } from "@/app/actions/history-actions";
import { notFound } from "next/navigation";
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
import AssessmentContent from "./assessment-content";
import { ApiKeyCheckDialog } from "@/components/api-key-check-dialog";
import { getCurrentUserAction } from "@/app/actions/user-actions";

type Props = {
  params: Promise<{
    assessmentId: string;
  }>;
};

export default async function AssessmentPage(props: Props) {
  const { assessmentId } = await props.params;
  const historyId = parseInt(assessmentId);
  if (isNaN(historyId)) notFound();

  const historyEntry = await getHistoryEntryAction(historyId);
  if (!historyEntry) notFound();

  const user = await getCurrentUserAction();

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

  return (
    <div className="container mx-auto py-2">
      <ApiKeyCheckDialog isOpenAIModule={true} user={user} />
      <Tabs defaultValue="assessment" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="assessment" className="mt-6">
          <Suspense key={historyEntry.assessmentCreated?.toString()}>
            <AssessmentContent
              moduleId={historyEntry.moduleId}
              entryId={historyEntry.id}
              assessmentText={historyEntry.assessmentText || undefined}
              assessmentCreated={historyEntry.assessmentCreated}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="transcript" className="mt-6">
          {historyEntry.transcript ? (
            <TranscriptDisplay transcriptEntries={historyEntry.transcript} />
          ) : (
            <p className="text-muted-foreground">No transcript available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
