"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploadButton } from "@/components/image-upload-button";
import { useState } from "react";
import Image from "next/image";
import { updateAvatarAction } from "@/app/actions/user-actions";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import { User } from "@/data/user";
import { OnboardingData } from "../onboarding-flow";

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
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);
  const { toast } = useToast();

  // Simple handler for display name changes
  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateData({ displayName: e.target.value });
  }

  async function handleAvatarUpload(url: string) {
    setIsAvatarUpdating(true);
    try {
      const response = await updateAvatarAction({ avatarUrl: url });
      if (response.success) {
        setAvatarUrl(url);
        updateData({ avatarUrl: url });
      } else {
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
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} alt={data.displayName} />
              <AvatarFallback>{getInitials(data.displayName)}</AvatarFallback>
            </Avatar>
            <ImageUploadButton
              bucket="avatars"
              folder="user-avatars"
              onUploadComplete={handleAvatarUpload}
              buttonText={isAvatarUpdating ? "Uploading..." : "Choose Avatar"}
              buttonVariant="outline"
              buttonSize="default"
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
            process. Your avatar is updated immediately. You can always update
            these later in the settings page.
          </p>
        </div>
      </div>
    </>
  );
}
