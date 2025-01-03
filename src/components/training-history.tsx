import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GripVertical } from "lucide-react";
import { getTrainingHistoryAction } from "@/app/actions/history-actions";
import { format } from "date-fns";
import { TrainingHistoryRow } from "@/components/training-history-row";

export async function TrainingHistory() {
  const entries = await getTrainingHistoryAction(10);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Training History</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Title</TableHead>
              <TableHead>Training Title</TableHead>
              <TableHead>Date/Time Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TrainingHistoryRow key={entry.id} id={entry.id}>
                <TableCell>{entry.moduleTitle}</TableCell>
                <TableCell>{entry.trainingTitle}</TableCell>
                <TableCell>
                  {entry.completedAt &&
                    format(new Date(entry.completedAt), "MMM d, yyyy HH:mm")}
                </TableCell>
              </TrainingHistoryRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
