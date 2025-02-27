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
import { useToast } from "@/hooks/use-toast";

type AccountFormProps = {
  user: User;
};

export function AccountForm({ user }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const newDisplayName = formData.get("displayName") as string;

      try {
        const response = await updateProfileAction({
          displayName: newDisplayName,
        });

        if (response.success) {
          setDisplayName(newDisplayName);
          toast({
            title: "Profile updated",
            description: "Your display name has been updated successfully.",
          });
        } else {
          console.log("Update failed:", response.error);
          toast({
            title: "Update failed",
            description: response.error || "Failed to update profile",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.log("Error updating profile:", error);
        toast({
          title: "Update failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  }

  async function handleAvatarUpload(url: string) {
    setIsAvatarUpdating(true);
    try {
      const response = await updateAvatarAction({ avatarUrl: url });
      if (response.success) setAvatarUrl(url);
      else {
        console.log("Failed to update avatar:", response.error);
        toast({
          title: "Update failed",
          description: response.error || "Failed to update avatar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Error updating avatar:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>
            {displayName.slice(0, 2).toUpperCase()}
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
            defaultValue={displayName}
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

        {/* Project Selection */}
        <div className="space-y-2">
          <Label>Current Project</Label>
          <div className="flex gap-4 max-w-md">
            <div className="flex-1 flex items-center gap-4">
              <Input
                value={user.currentProject?.name || "No project selected"}
                disabled
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProjectDialog(true)}
              >
                Select Project
              </Button>
            </div>
          </div>
          <ProjectDialog
            open={showProjectDialog}
            onOpenChange={setShowProjectDialog}
          />
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
