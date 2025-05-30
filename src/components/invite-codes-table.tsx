"use client";

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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, isAfter } from "date-fns";
import { useState, useMemo } from "react";
import { type InviteCode } from "@/data/invite-codes";
import { deleteInviteCodesAction } from "@/app/actions/invite-code-actions";
import { useToast } from "@/hooks/use-toast";
import { CopyIcon, Trash2Icon, SettingsIcon } from "lucide-react";
import { logger } from "@/lib/logger";
import { ManageCodesDialog } from "@/components/manage-codes-dialog";

type InviteCodesTableProps = {
  inviteCodes: InviteCode[];
  onInviteCodeChange: () => void;
  pageSize?: number;
};

type FilterType = "all" | "valid" | "expired";

export function InviteCodesTable({
  inviteCodes,
  onInviteCodeChange,
  pageSize = 10,
}: InviteCodesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{
    codes: InviteCode[];
    createdFor: string;
  } | null>(null);
  const { toast } = useToast();

  // Helper function to check if invite code is expired
  const isExpired = (inviteCode: InviteCode): boolean => {
    const expirationDate = addDays(
      new Date(inviteCode.created_at),
      inviteCode.expire_by
    );
    return !isAfter(expirationDate, new Date());
  };

  // Group invite codes by created_for
  const groupedInviteCodes = useMemo(() => {
    const groups = inviteCodes.reduce(
      (acc, code) => {
        const createdFor = code.created_for || "General Use";
        if (!acc[createdFor]) {
          acc[createdFor] = [];
        }
        acc[createdFor].push(code);
        return acc;
      },
      {} as Record<string, InviteCode[]>
    );

    // Convert to array and apply filter
    return Object.entries(groups)
      .map(([createdFor, codes]) => ({
        createdFor,
        codes: codes.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        hasExpired: codes.some((code) => isExpired(code)),
        hasValid: codes.some((code) => !isExpired(code)),
        uniqueExpirationDates: [
          ...new Set(
            codes.map((code) =>
              format(
                addDays(new Date(code.created_at), code.expire_by),
                "MMM d, yyyy"
              )
            )
          ),
        ].sort(),
      }))
      .filter((group) => {
        if (filter === "expired") return group.hasExpired;
        if (filter === "valid") return group.hasValid;
        return true;
      })
      .sort((a, b) => {
        // Sort by most recent creation date within the group
        const aLatest = Math.max(
          ...a.codes.map((c) => new Date(c.created_at).getTime())
        );
        const bLatest = Math.max(
          ...b.codes.map((c) => new Date(c.created_at).getTime())
        );
        return bLatest - aLatest;
      });
  }, [inviteCodes, filter]);

  const totalPages = Math.ceil(groupedInviteCodes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentGroups = groupedInviteCodes.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleCopyAllCodes = async (
    codes: InviteCode[],
    createdFor: string
  ) => {
    const key = `copy-${createdFor}`;
    setIsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const codesList = codes.map((c) => c.code).join("\n");
      await navigator.clipboard.writeText(codesList);
      toast({
        title: "Copied",
        description: `${codes.length} codes copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteAllCodes = async (
    codes: InviteCode[],
    createdFor: string
  ) => {
    const key = `delete-${createdFor}`;
    setIsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const codeIds = codes.map((c) => c.id);
      await deleteInviteCodesAction(codeIds);
      toast({
        title: "Success",
        description: `${codes.length} codes deleted successfully`,
      });
      onInviteCodeChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete codes",
        variant: "destructive",
      });
      logger.error(`Failed to delete invite codes: ${error}`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleManageCodes = (codes: InviteCode[], createdFor: string) => {
    setSelectedGroup({ codes, createdFor });
    setManageDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleManageDialogClose = () => {
    setManageDialogOpen(false);
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Filter:</span>
          <Select
            value={filter}
            onValueChange={(value: FilterType) => {
              setFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="valid">Valid Only</SelectItem>
              <SelectItem value="expired">Expired Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {groupedInviteCodes.length} group
          {groupedInviteCodes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created For</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiration Dates</TableHead>
              <TableHead>Codes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-muted-foreground"
                >
                  No invite codes found
                </TableCell>
              </TableRow>
            ) : (
              currentGroups.map((group) => (
                <TableRow key={group.createdFor}>
                  <TableCell className="font-medium">
                    {group.createdFor === "General Use" ? (
                      <span className="text-muted-foreground italic">
                        General Use
                      </span>
                    ) : (
                      group.createdFor
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {group.codes.length} code
                      {group.codes.length !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {group.hasValid && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          Valid
                        </Badge>
                      )}
                      {group.hasExpired && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-600"
                        >
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {group.uniqueExpirationDates.slice(0, 3).map((date) => (
                        <div key={date} className="text-sm">
                          {date}
                        </div>
                      ))}
                      {group.uniqueExpirationDates.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{group.uniqueExpirationDates.length - 3} more dates
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() =>
                          handleCopyAllCodes(group.codes, group.createdFor)
                        }
                        disabled={isLoading[`copy-${group.createdFor}`]}
                      >
                        <CopyIcon className="h-3 w-3 mr-1" />
                        Copy All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          handleDeleteAllCodes(group.codes, group.createdFor)
                        }
                        disabled={isLoading[`delete-${group.createdFor}`]}
                      >
                        <Trash2Icon className="h-3 w-3 mr-1" />
                        Delete All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs hover:bg-muted"
                        onClick={() =>
                          handleManageCodes(group.codes, group.createdFor)
                        }
                      >
                        <SettingsIcon className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
              {Array.from({ length: totalPages }).map((_, i) => (
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
      )}

      {/* Manage Codes Dialog */}
      {selectedGroup && (
        <ManageCodesDialog
          isOpen={manageDialogOpen}
          onClose={handleManageDialogClose}
          codes={selectedGroup.codes}
          createdFor={selectedGroup.createdFor}
          onCodeDeleted={onInviteCodeChange}
        />
      )}
    </div>
  );
}
