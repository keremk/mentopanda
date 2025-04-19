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
import { format } from "date-fns";
import { useState } from "react";
import { Invitation } from "@/data/invitations";
import {
  deleteInvitationAction,
  resendInviteEmailAction,
} from "@/app/actions/invitation-actions";
import { useToast } from "@/hooks/use-toast";
import { MailIcon, Trash2Icon } from "lucide-react";

type TrialInvitationsTableProps = {
  invitations: Invitation[];
  onInvitationChange: () => void;
  pageSize?: number;
};

export function TrialInvitationsTable({
  invitations,
  onInvitationChange,
  pageSize = 10,
}: TrialInvitationsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const totalPages = Math.ceil(invitations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentInvitations = invitations.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleResend = async (invitationId: number) => {
    setIsLoading((prev) => ({ ...prev, [invitationId]: true }));
    try {
      await resendInviteEmailAction(
        invitationId,
        "You've been invited to try MentoPanda",
        true
      );
      toast({
        title: "Success",
        description: "Invitation email resent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation email",
        variant: "destructive",
      });
      console.log("Failed to resend invitation email", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleDelete = async (invitationId: number) => {
    setIsLoading((prev) => ({ ...prev, [invitationId]: true }));
    try {
      await deleteInvitationAction(invitationId);
      toast({
        title: "Success",
        description: "Invitation deleted successfully",
      });
      onInvitationChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      });
      console.log("Failed to delete invitation", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitee Email</TableHead>
              <TableHead>Date Invited</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Resend</TableHead>
              <TableHead className="w-[70px]">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-muted-foreground"
                >
                  No trial invitations found
                </TableCell>
              </TableRow>
            ) : (
              currentInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.inviteeEmail}</TableCell>
                  <TableCell>
                    {format(
                      new Date(invitation.createdAt),
                      "MMM d, yyyy HH:mm"
                    )}
                  </TableCell>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleResend(invitation.id)}
                      disabled={isLoading[invitation.id]}
                    >
                      <MailIcon className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => handleDelete(invitation.id)}
                      disabled={isLoading[invitation.id]}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
    </>
  );
}
