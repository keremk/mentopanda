"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageEdit } from "@/components/image-edit";
import { useState } from "react";
import Image from "next/image";
import { updateAvatarAction } from "@/app/actions/user-actions";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/data/user";
import { OnboardingData } from "../onboarding-flow";
import { logger } from "@/lib/logger";

type ProfileSetupProps = {
  user: User;
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
};

export function ProfileSetup({ user, data, updateData }: ProfileSetupProps) {
  // Use local state for UI only
  const [avatarUrl, setAvatarUrl] = useState(
    data.avatarUrl || user.avatarUrl || ""
  );
  const { toast } = useToast();

  // Simple handler for display name changes
  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateData({ displayName: e.target.value });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleAvatarChange(newUrl: string, ..._unused: unknown[]) {
    try {
      const response = await updateAvatarAction({ avatarUrl: newUrl });
      if (response.success) {
        setAvatarUrl(newUrl);
        updateData({ avatarUrl: newUrl });
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully",
        });
      } else {
        logger.error("Failed to update avatar:", response.error);
        toast({
          title: "Update failed",
          description: response.error || "Failed to update avatar",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error updating avatar:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-profile-setup.jpg"
          alt="Profile setup visualization"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute top-4 right-4 text-4xl">🐼</div>
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">
          Set Up Your Profile
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          Let&apos;s personalize your MentoPanda experience
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6 pb-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="space-y-4 flex flex-col items-center w-full md:w-48">
            <ImageEdit
              initialImageUrl={avatarUrl}
              bucketName="avatars"
              storageFolderPath="user-avatars"
              contextId={user.id}
              contextType="user"
              aspectRatio="square"
              onImageChange={handleAvatarChange}
              imageShape="circle"
              imageContainerClassName="h-32 w-32"
              buttonSize="sm"
              buttonVariant="outline"
              showButtonLabels={false}
            />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={data.displayName}
                onChange={handleDisplayNameChange}
                placeholder="Enter your name"
                className="bg-secondary/30 rounded-lg border-border/30 shadow-sm"
              />
              <p className="text-sm text-muted-foreground">
                This is how you&apos;ll appear to others in the platform
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Your display name will be updated when you complete the setup
            process. Your avatar is updated immediately. You can upload a new
            image or generate one using AI. You can always update these later in
            the settings page.
          </p>
        </div>
      </div>
    </>
  );
}
