"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { GripVertical } from "lucide-react";
import { getTrainingHistoryAction } from "@/app/actions/history-actions";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { HistorySummary } from "@/data/history";

export function TrainingHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entries, setEntries] = useState<HistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const result = await getTrainingHistoryAction(page);
      setEntries(result.entries);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Training History</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto flex flex-col">
        <div className="flex-grow overflow-auto">
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
        </div>
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingHistoryRow({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => {
        window.location.href = `/assessments/${id}`;
      }}
    >
      {children}
    </TableRow>
  );
}