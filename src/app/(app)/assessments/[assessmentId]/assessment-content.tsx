"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

type Props = {
  assessment: string;
  transcript?: string | null;
};

export function AssessmentContent({ assessment, transcript }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="space-y-6">
          <MarkdownRenderer content={assessment} />

          {transcript && (
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="w-full"
            >
              <div className="flex items-center justify-between py-2">
                <h3 className="text-lg font-semibold">
                  Conversation Transcript
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle transcript</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <Card className="p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {transcript}
                  </pre>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
