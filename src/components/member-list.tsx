"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import type { ProjectMember } from "@/data/projects";
import { useRouter, useParams } from "next/navigation";
import { UserRole } from "@/data/user";
import { createInvitationAction } from "@/app/actions/invitation-actions";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberListProps = {
  members: ProjectMember[];
  canManageMembers: boolean;
};

export function MemberList({ members, canManageMembers }: MemberListProps) {
  const router = useRouter();
  const params = useParams();
  const currentMemberId = params.memberId;
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("member");
  const createDialogCloseRef = useRef<HTMLButtonElement>(null);
  const deleteDialogCloseRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const selectedMemberData = members.find((m) => m.id === currentMemberId);
  const isMemberSelected = Boolean(currentMemberId);

  function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  }

  async function handleInviteMember() {
    if (!newMemberEmail.trim()) return;
    try {
      await createInvitationAction(newMemberEmail, selectedRole);
      toast({
        title: "Success",
        description:
          "Invitation sent successfully, you will see them in the team when they accept the invitation",
      });
      setNewMemberEmail("");
      createDialogCloseRef.current?.click();
    } catch (error) {
      console.error(`Failed to send invitation: ${error}`);
      toast({
        title: "Error",
        description: "Failed to send invitation, please try again",
        variant: "destructive",
      });
    }
  }

  async function handleRemoveMember() {
    if (!currentMemberId) return;
    // TODO: Implement remove member action
    deleteDialogCloseRef.current?.click();
  }

  return (
    <div className="flex flex-col h-full w-60 border-r">
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {members?.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                member.id === currentMemberId ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => router.push(`/team/${member.id}`)}
            >
              <Avatar>
                <AvatarImage
                  src={member.avatar_url}
                  alt={member.name || "Team member"}
                />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {member.name || "Unnamed Member"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.role || "No role"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {canManageMembers && (
        <div className="border-t p-2 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <PlusCircle className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you want to invite.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="mb-4"
              />
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: UserRole) => setSelectedRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose ref={createDialogCloseRef} asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleInviteMember}
                  disabled={!newMemberEmail.trim()}
                >
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!isMemberSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Team Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove{" "}
                  {selectedMemberData?.name || "this member"} from the team?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose ref={deleteDialogCloseRef} asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleRemoveMember}
                  disabled={!currentMemberId}
                >
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
