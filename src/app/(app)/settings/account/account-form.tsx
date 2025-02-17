"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateProfileAction,
  updateAvatarAction,
} from "@/app/actions/user-actions";
import { useTransition, useState } from "react";
import type { User } from "@/data/user";
import { ImageUploadButton } from "@/components/image-upload-button";
import { ProjectDialog } from "@/components/project-dialog";
import { ApiKeyInput } from "@/components/api-key-input";

type AccountFormProps = {
  user: User;
};

export function AccountForm({ user }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfileAction({
        displayName: formData.get("displayName") as string,
      });
    });
  }

  async function handleAvatarUpload(url: string) {
    setIsAvatarUpdating(true);
    try {
      const response = await updateAvatarAction({ avatarUrl: url });
      if (response.success) setAvatarUrl(url);
      else console.error("Failed to update avatar:", response.error);
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={user.displayName} />
          <AvatarFallback>
            {user.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <ImageUploadButton
          bucket="avatars"
          folder="user-avatars"
          onUploadComplete={handleAvatarUpload}
          buttonText={isAvatarUpdating ? "Updating..." : "Change Avatar"}
          dialogTitle="Upload Avatar"
          buttonVariant="outline"
          buttonSize="sm"
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Display Name Field */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={user.displayName}
            className="max-w-md"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex gap-4 max-w-md">
            <Input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
              className="flex-1"
            />
          </div>
        </div>

        {/* Project Name Field */}
        <div className="space-y-2">
          <Label htmlFor="orgName">Project Name</Label>
          <div className="flex gap-4 max-w-md">
            <Input
              id="orgName"
              name="orgName"
              defaultValue={user.currentProject.name}
              className="flex-1"
            />
            <ProjectDialog
              onProjectCreate={() => {
                startTransition(async () => {
                  await updateProfileAction({
                    displayName: user.displayName,
                  });
                });
              }}
            >
              <Button type="button" variant="outline">
                Edit Project
              </Button>
            </ProjectDialog>
          </div>
        </div>

        {/* API Key Field */}
        <ApiKeyInput />
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
