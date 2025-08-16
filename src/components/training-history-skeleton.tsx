import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TrainingHistoryTableSkeleton() {
  return (
    <div className="grow overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session Title</TableHead>
            <TableHead>Training Title</TableHead>
            <TableHead>Date/Time Taken</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
