"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createInvitationAction } from "@/app/actions/invitation-actions";
import { UserRole } from "@/data/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { PlusIcon } from "lucide-react";

type TrialInviteDialogProps = {
  onInvitationCreated: () => void;
};

export function TrialInviteDialog({
  onInvitationCreated,
}: TrialInviteDialogProps) {
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const emailSchema = z.string().email("Please enter a valid email address");

  async function handleSendInvite() {
    setError(null);

    try {
      // Validate email
      emailSchema.parse(inviteeEmail);

      setIsLoading(true);
      await createInvitationAction(
        inviteeEmail,
        selectedRole,
        "You've been invited to try MentoPanda",
        true, // isTrial
        true // isPromoInvitation
      );

      toast({
        title: "Success",
        description: "Trial invitation sent successfully",
      });

      // Reset form and close dialog
      setInviteeEmail("");
      setSelectedRole("admin");
      setIsOpen(false);
      onInvitationCreated();
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to send invitation");
      }
      toast({
        title: "Error",
        description: error || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    setInviteeEmail("");
    setSelectedRole("admin");
    setError(null);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand text-brand-foreground hover:bg-brand-hover">
          <PlusIcon className="h-4 w-4 mr-2" />
          Invite for Trial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User for Trial</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to invite for a
            trial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: UserRole) => setSelectedRole(value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            disabled={isLoading || !inviteeEmail.trim()}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
