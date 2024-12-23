"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfileAction } from "@/app/actions/user-actions";
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

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateProfileAction({
        displayName: formData.get("displayName") as string,
        organizationName: formData.get("orgName") as string,
      });
    });
  }

  function handleUploadComplete(url: string) {
    setAvatarUrl(url);
    setIsUploadOpen(false);
  }

  return (
    <form action={handleSubmit}>
      {/* Avatar Section */}
      <div className="flex items-start space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={user.displayName} />
          <AvatarFallback>
            {user.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Change Avatar
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
        <div className="flex space-x-2 max-w-md">
          <Input id="email" type="email" defaultValue={user.email} disabled />
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

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
