"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateProfileAction,
  updateAvatarAction,
  updatePasswordAction,
} from "@/app/actions/user-actions";
import React, { useTransition, useState, useRef } from "react";
import type { User } from "@/data/user";
import { ImageUploadButton } from "@/components/image-upload-button";
import { ProjectDialog } from "@/components/project-dialog";
import { ApiKeyInput } from "@/components/api-key-input";
import { useToast } from "@/hooks/use-toast";
import { getInitials, cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

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

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    newPassword?: string[];
    confirmPassword?: string[];
  } | null>(null);

  const changePasswordFormRef = useRef<HTMLFormElement>(null);

  const isEmailProvider =
    !user.app_metadata?.provider || user.app_metadata.provider === "email";
  const authProvider = user.app_metadata?.provider;

  async function handleSubmitProfile(formData: FormData) {
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
            description: "Your display name has been updated.",
          });
        } else {
          console.error("Update failed:", response.error);
          toast({
            title: "Update failed",
            description: response.error || "Failed to update profile",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
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
      if (response.success) {
        setAvatarUrl(url);
        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully.",
        });
      } else {
        console.error("Failed to update avatar:", response.error);
        toast({
          title: "Update failed",
          description: response.error || "Failed to update avatar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAvatarUpdating(false);
    }
  }

  async function handleChangePasswordSubmit(formData: FormData) {
    setIsPasswordUpdating(true);
    setPasswordUpdateError(null);
    setPasswordFieldErrors(null);

    try {
      const result = await updatePasswordAction(formData);

      if (result.success) {
        toast({
          title: "Password Updated",
          description: "Please sign in with your new password.",
        });
        setIsPasswordDialogOpen(false);
      } else {
        setPasswordUpdateError(result.error || "An unknown error occurred.");
        if (result.fieldErrors) {
          setPasswordFieldErrors(result.fieldErrors);
        }
        toast({
          title: "Password Update Failed",
          description: result.error || "Could not update password.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Password change error:", e);
      setPasswordUpdateError("An unexpected error occurred.");
      toast({
        title: "Password Update Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  }

  return (
    <form
      action={handleSubmitProfile}
      className="space-y-6 max-w-2xl px-2 py-6"
    >
      <div className="flex items-start gap-8">
        <div className="space-y-4 flex flex-col items-center w-48">
          <Avatar className="h-32 w-32">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? ""} />
            <AvatarFallback>{getInitials(displayName ?? "")}</AvatarFallback>
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
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="displayName" className="text-muted-foreground">
              Display Name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={displayName ?? ""}
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="email" className="text-muted-foreground">
                Email Address
              </Label>
              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
              >
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={isEmailProvider ? -1 : 0}
                        className={cn(
                          !isEmailProvider ? "cursor-not-allowed" : ""
                        )}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            disabled={!isEmailProvider}
                          >
                            Change Password
                          </Button>
                        </DialogTrigger>
                      </span>
                    </TooltipTrigger>
                    {!isEmailProvider && (
                      <TooltipContent side="bottom" align="end">
                        <p className="text-xs max-w-[200px]">
                          Cannot change password when using{" "}
                          <span className="font-semibold capitalize">
                            {authProvider}
                          </span>{" "}
                          login.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Your Password</DialogTitle>
                    <DialogDescription>
                      Enter a new password for your account. Make sure it&apos;s
                      strong and memorable.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    ref={changePasswordFormRef}
                    action={handleChangePasswordSubmit}
                    className="grid gap-4 py-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        className={cn(
                          passwordFieldErrors?.newPassword
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                      />
                      {passwordFieldErrors?.newPassword && (
                        <p className="text-xs text-destructive">
                          {passwordFieldErrors.newPassword.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className={cn(
                          passwordFieldErrors?.confirmPassword
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                      />
                      {passwordFieldErrors?.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {passwordFieldErrors.confirmPassword.join(", ")}
                        </p>
                      )}
                    </div>
                    {passwordUpdateError && !passwordFieldErrors && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{passwordUpdateError}</span>
                      </div>
                    )}
                    <DialogFooter className="mt-4">
                      <Button
                        type="submit"
                        variant="brand"
                        disabled={isPasswordUpdating}
                      >
                        {isPasswordUpdating ? "Updating..." : "Update Password"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="email"
              type="email"
              defaultValue={user.email ?? "No email found"}
              disabled
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
          </div>
        </div>
      </div>

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
          currentProjectId={user.currentProject?.id ?? null}
        />
      </div>

      <ApiKeyInput className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm" />

      <div className="flex flex-col gap-y-2">
        <Label className="text-muted-foreground">Current Subscription</Label>
        <div className="flex gap-4">
          <Input
            value={
              user.pricingPlan
                ? user.pricingPlan.charAt(0).toUpperCase() +
                  user.pricingPlan.slice(1)
                : "N/A"
            }
            disabled
            className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
          />
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button type="button" variant="ghost-brand" disabled={true}>
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
