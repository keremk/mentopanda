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
import { ImageUpload } from "@/components/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AccountFormProps = {
  user: User;
};

export function AccountForm({ user }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfileAction({
        displayName: formData.get("displayName") as string,
        organizationName: formData.get("orgName") as string,
      });
    });
  }

  async function handleUploadComplete(url: string) {
    setIsAvatarUpdating(true);
    try {
      const response = await updateAvatarAction({ avatarUrl: url });
      if (response.success) {
        setAvatarUrl(url);
        setIsUploadOpen(false);
      } else {
        // You might want to show an error toast here
        console.error("Failed to update avatar:", response.error);
      }
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
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAvatarUpdating}
            >
              {isAvatarUpdating ? "Updating..." : "Change Avatar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] p-0 gap-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Upload Avatar</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 pt-0">
              <ImageUpload
                bucket="avatars"
                folder="user-avatars"
                onUploadComplete={handleUploadComplete}
                allowedFileTypes={["image/jpeg", "image/png", "image/webp"]}
              />
            </div>
          </DialogContent>
        </Dialog>
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
            <Button type="button" variant="outline">
              Change Email
            </Button>
          </div>
        </div>

        {/* Organization Name Field */}
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            name="orgName"
            defaultValue={user.organizationName}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
