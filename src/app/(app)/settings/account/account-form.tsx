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
import { getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
            description: "Your settings have been updated successfully.",
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
    <form action={handleSubmit} className="space-y-6 max-w-2xl px-2 py-6">
      {/* Avatar Section */}
      <div className="flex items-start gap-8">
        <div className="space-y-4 flex flex-col items-center w-48">
          <Avatar className="h-32 w-32">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <ImageUploadButton
            bucket="avatars"
            folder="user-avatars"
            onUploadComplete={handleAvatarUpload}
            buttonText={isAvatarUpdating ? "Updating..." : "Change Avatar"}
            buttonVariant="ghost-brand"
            buttonSize="default"
          />
        </div>

        <div className="flex-1 space-y-6 py-2">
          {/* Display Name Field */}
          <div className="flex flex-col gap-y-2">
            <Label className="text-muted-foreground">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={displayName}
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-y-2">
            <Label className="text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email}
              disabled
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
          </div>
        </div>
      </div>

      {/* Project Selection */}
      <div className="flex flex-col gap-y-2">
        <Label className="text-muted-foreground">Current Project</Label>
        <div className="flex gap-4">
          <Input
            value={user.currentProject?.name || "No project selected"}
            disabled
            className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
          />
          <Button
            type="button"
            variant="ghost-brand"
            onClick={() => setShowProjectDialog(true)}
          >
            Select Project
          </Button>
        </div>
        <ProjectDialog
          open={showProjectDialog}
          onOpenChange={setShowProjectDialog}
        />
      </div>

      {/* API Key Field */}
      <ApiKeyInput className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm" />

      <div className="flex flex-col gap-y-2">
        <Label className="text-muted-foreground">Current Subscription</Label>
        <div className="flex gap-4">
          <Input
            value={
              user.pricingPlan.charAt(0).toUpperCase() +
              user.pricingPlan.slice(1)
            }
            disabled
            className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="button"
                    variant="ghost-brand"
                    disabled={true}
                  >
                    Manage Subscription
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          variant="brand"
          disabled={isPending}
          className="shadow-sm hover:shadow-md transition-all"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
