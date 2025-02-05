import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { TrainingHistoryTable } from "./training-history-table";
import { TrainingHistoryTableSkeleton } from "./training-history-skeleton";

export function TrainingHistory() {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Training History</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto flex flex-col">
        <Suspense fallback={<TrainingHistoryTableSkeleton />}>
          <TrainingHistoryTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}
