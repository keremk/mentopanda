"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type UserRole } from "@/data/user";
import { updateProjectMemberRoleAction } from "@/app/actions/project-actions";

export function MemberRoleSelector({
  projectId,
  memberId,
  currentRole,
}: {
  projectId: number;
  memberId: string;
  currentRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(currentRole);

  return (
    <div className="flex items-center gap-4">
      <div className="flex-grow">
        <label className="text-sm font-medium leading-none mb-2 block">
          Project Membership Level
        </label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="mt-6"
        onClick={async () => {
          await updateProjectMemberRoleAction(projectId, memberId, role);
        }}
      >
        Update
      </Button>
    </div>
  );
}
