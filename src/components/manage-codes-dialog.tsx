"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { deleteInviteCodeAction } from "@/app/actions/invite-code-actions";
import { format, addDays } from "date-fns";
import { type InviteCode } from "@/data/invite-codes";
import { CopyIcon, Trash2Icon } from "lucide-react";
import { logger } from "@/lib/logger";

type ManageCodesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  codes: InviteCode[];
  createdFor: string;
  onCodeDeleted: () => void;
};

export function ManageCodesDialog({
  isOpen,
  onClose,
  codes,
  createdFor,
  onCodeDeleted,
}: ManageCodesDialogProps) {
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      logger.error(`Failed to copy code: ${error}`);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCode = async (inviteCodeId: number) => {
    setIsLoading((prev) => ({ ...prev, [inviteCodeId]: true }));
    try {
      await deleteInviteCodeAction(inviteCodeId);
      toast({
        title: "Success",
        description: "Code deleted successfully",
      });
      onCodeDeleted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete code",
        variant: "destructive",
      });
      logger.error(`Failed to delete invite code: ${error}`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [inviteCodeId]: false }));
    }
  };

  const getExpirationDate = (inviteCode: InviteCode): Date => {
    return addDays(new Date(inviteCode.created_at), inviteCode.expire_by);
  };

  const isExpired = (inviteCode: InviteCode): boolean => {
    return new Date() > getExpirationDate(inviteCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Codes</DialogTitle>
          <DialogDescription>
            {createdFor === "General Use" ? (
              <span className="italic">General Use</span>
            ) : (
              createdFor
            )}{" "}
            - {codes.length} code{codes.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {code.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {format(getExpirationDate(code), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        isExpired(code)
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : code.validated
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {isExpired(code)
                        ? "Expired"
                        : code.validated
                          ? "Used"
                          : "Valid"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted"
                        onClick={() => handleCopyCode(code.code)}
                        title="Copy code"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteCode(code.id)}
                        disabled={isLoading[code.id]}
                        title="Delete code"
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
