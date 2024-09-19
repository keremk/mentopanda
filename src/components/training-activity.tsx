"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import Link from "next/link";
import { GripVertical } from "lucide-react";

type TrainingSession = {
  id: number;
  sessionTitle: string;
  trainingTitle: string;
  dateTaken: string;
};

type TrainingActivityProps = {
  sessions: TrainingSession[];
};

type SortKey = "dateTaken" | "trainingTitle";

export default function TrainingActivity({ sessions }: TrainingActivityProps) {
  const [sortKey, setSortKey] = useState<SortKey>("dateTaken");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortKey === "dateTaken") {
      return sortOrder === "asc"
        ? new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime()
        : new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime();
    } else {
      return sortOrder === "asc"
        ? a.trainingTitle.localeCompare(b.trainingTitle)
        : b.trainingTitle.localeCompare(a.trainingTitle);
    }
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Training Activity</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Title</TableHead>
              <TableHead
                onClick={() => toggleSort("trainingTitle")}
                className="cursor-pointer"
              >
                Training Title
                {sortKey === "trainingTitle" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline ml-1" />
                  ) : (
                    <ChevronDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => toggleSort("dateTaken")}
                className="cursor-pointer"
              >
                Date/Time Taken
                {sortKey === "dateTaken" &&
                  (sortOrder === "asc" ? (
                    <ChevronUp className="inline ml-1" />
                  ) : (
                    <ChevronDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead>Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.sessionTitle}</TableCell>
                <TableCell>{session.trainingTitle}</TableCell>
                <TableCell>{formatDate(session.dateTaken)}</TableCell>
                <TableCell>
                  <Link href={`/analysis/${session.id}`} passHref>
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
