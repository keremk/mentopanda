"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Mail, Calendar, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteWaitingListEntryAction } from "@/app/actions/waiting-list-actions";
import { useToast } from "@/hooks/use-toast";
import { GenerateInviteCodesDialog } from "@/components/generate-invite-codes-dialog";
import { type WaitingListEntry } from "@/data/waiting-list";
import { logger } from "@/lib/logger";

type WaitlistManagerProps = {
  initialWaitlistEntries: WaitingListEntry[];
};

export function WaitlistManager({
  initialWaitlistEntries,
}: WaitlistManagerProps) {
  const [waitlistEntries, setWaitlistEntries] = useState(
    initialWaitlistEntries
  );
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (entryId: number) => {
    try {
      await deleteWaitingListEntryAction(entryId);
      setWaitlistEntries(
        waitlistEntries.filter((entry) => entry.id !== entryId)
      );
      toast({
        title: "Entry removed",
        description: "Waiting list entry has been deleted.",
      });
    } catch (error) {
      logger.error("Error deleting waiting list entry", error);
      toast({
        title: "Error",
        description: "Failed to delete waiting list entry.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Waiting List Management
          </CardTitle>
          <CardDescription>
            Manage people waiting for access to MentoPanda. Accept entries to
            generate invite codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  {waitlistEntries.length}{" "}
                  {waitlistEntries.length === 1 ? "entry" : "entries"}
                </Badge>
              </div>
            </div>

            {waitlistEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No waiting list entries yet.</p>
                <p className="text-sm">
                  People who join the waiting list will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlistEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {entry.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(entry.date_requested)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.comment ? (
                          <div className="flex items-start gap-2 max-w-xs">
                            <span
                              className="text-sm truncate"
                              title={entry.comment}
                            >
                              {entry.comment}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No comment
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <GenerateInviteCodesDialog
                            onCodesGenerated={() => {
                              setWaitlistEntries(
                                waitlistEntries.filter((e) => e.id !== entry.id)
                              );
                              toast({
                                title: "Success",
                                description: `Invite codes generated for ${entry.email}`,
                              });
                            }}
                            initialCreatedFor={entry.email}
                          >
                            <Button size="sm" variant="ghost-brand">
                              <UserCheck className="h-4 w-4 mr-1" />
                              
                            </Button>
                          </GenerateInviteCodesDialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
