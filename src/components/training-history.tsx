import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrainingHistoryTable } from "./training-history-table";
import { TrainingHistoryTableSkeleton } from "./training-history-skeleton";

export function TrainingHistory({ forUserId }: { forUserId?: string }) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-brand">Training History</CardTitle>
      </CardHeader>
      <CardContent className="grow overflow-auto flex flex-col">
        <Suspense fallback={<TrainingHistoryTableSkeleton />}>
          <TrainingHistoryTable forUserId={forUserId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
