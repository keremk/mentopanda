import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TranscriptEntry } from "@/types/chat-types";

type Props = {
  assessment: string;
  transcript?: TranscriptEntry[];
};

export function AssessmentContent({ assessment, transcript }: Props) {
  return (
    <div className="container mx-auto py-2">
      <Tabs defaultValue="assessment" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="assessment" className="mt-6">
          <MarkdownRenderer content={assessment} />
        </TabsContent>
        <TabsContent value="transcript" className="mt-6">
          {transcript ? (
            <TranscriptDisplay transcript={transcript} />
          ) : (
            <p className="text-muted-foreground">No transcript available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
