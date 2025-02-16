"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateProfileAction,
  updateAvatarAction,
} from "@/app/actions/user-actions";
import { useTransition, useState, useEffect } from "react";
import type { User } from "@/data/user";
import { ImageUploadButton } from "@/components/image-upload-button";
import { getStoredApiKey, storeApiKey, removeApiKey } from "@/lib/apikey";
import { ProjectDialog } from "@/components/project-dialog";

type AccountFormProps = {
  user: User;
};

export function AccountForm({ user }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    async function loadApiKey() {
      const storedApiKey = await getStoredApiKey();
      if (storedApiKey) setApiKey(storedApiKey);
    }
    loadApiKey();
  }, []);

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

  async function handleApiKeyChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const newApiKey = event.target.value;
    setApiKey(newApiKey);
    await storeApiKey(newApiKey);
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
        <div className="space-y-2">
          <Label htmlFor="apiKey">OpenAI API Key</Label>
          <div className="flex gap-4 max-w-md">
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="sk-..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApiKey("");
                removeApiKey();
              }}
            >
              Clear Key
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key is stored locally and never sent to our servers
          </p>
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
