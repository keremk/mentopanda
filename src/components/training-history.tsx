import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart2, GripVertical } from "lucide-react";
import Link from "next/link";
import { getTrainingHistoryAction } from "@/app/(app)/historyActions";
interface HistoryEntry {
  id: number;
  module_id: number;
  moduleTitle: string;
  trainingTitle: string;
  started_at: Date;
  completed_at: Date | null;
  assessment_score: number | null;
  assessment_text: string | null;
}

export async function TrainingHistory() {
  const entries = await getTrainingHistoryAction(10);

  function formatDate(date: Date) {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

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
              <TableHead>Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.moduleTitle}</TableCell>
                <TableCell>{entry.trainingTitle}</TableCell>
                <TableCell>{formatDate(entry.startedAt)}</TableCell>
                <TableCell>
                  <Link href={`/analysis/${entry.id}`} passHref>
                    <Button variant="outline" size="sm">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Analysis
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
