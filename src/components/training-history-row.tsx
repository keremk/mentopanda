"use client";

import { TableRow } from "@/components/ui/table";

export function TrainingHistoryRow({
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
