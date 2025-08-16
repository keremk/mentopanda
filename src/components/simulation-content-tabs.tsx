"use client";

import { Module } from "@/data/modules";
import { TranscriptEntry } from "@/types/chat-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { TranscriptDisplay } from "@/components/transcript-display";

interface SimulationContentTabsProps {
  module: Module;
  notes: string | null;
  transcriptEntries: TranscriptEntry[];
}

function DesktopContentTabs({
  module,
  notes,
  transcriptEntries,
}: SimulationContentTabsProps) {
  return (
    <div className="h-full overflow-hidden">
      <Tabs defaultValue="instructions" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="instructions" className="flex-1 mt-4 overflow-auto">
          <Card>
            <CardContent className="pt-6">
              {module.instructions ? (
                <MemoizedMarkdown content={module.instructions} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No instructions available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="flex-1 mt-4 overflow-auto">
          <Card>
            <CardContent className="pt-6">
              {notes ? (
                <MemoizedMarkdown content={notes} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No notes available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transcript" className="flex-1 mt-4 overflow-auto">
          <Card>
            <CardContent className="pt-6">
              <TranscriptDisplay transcriptEntries={transcriptEntries} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileContentTabs({
  module,
  notes,
  transcriptEntries,
}: SimulationContentTabsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="flex justify-around gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1">
              Instructions
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-4/5 flex flex-col">
            <SheetHeader>
              <SheetTitle>Instructions</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              {module.instructions ? (
                <MemoizedMarkdown content={module.instructions} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No instructions available.
                </p>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1">
              Notes
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-4/5 flex flex-col">
            <SheetHeader>
              <SheetTitle>Notes</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              {notes ? (
                <MemoizedMarkdown content={notes} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No notes available.
                </p>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1">
              Transcript
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-4/5 flex flex-col">
            <SheetHeader>
              <SheetTitle>Transcript</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <TranscriptDisplay transcriptEntries={transcriptEntries} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function SimulationContentTabs({
  module,
  notes,
  transcriptEntries,
}: SimulationContentTabsProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileContentTabs
      module={module}
      notes={notes}
      transcriptEntries={transcriptEntries}
    />
  ) : (
    <DesktopContentTabs
      module={module}
      notes={notes}
      transcriptEntries={transcriptEntries}
    />
  );
}
