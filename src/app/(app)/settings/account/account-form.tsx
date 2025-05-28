"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  updateAvatarAction,
  updatePasswordAction,
} from "@/app/actions/user-actions";
import React, { useTransition, useState, useRef } from "react";
import type { User } from "@/data/user";
import type { Usage } from "@/data/usage";
import { ImageEdit } from "@/components/image-edit";
import { ProjectDialog } from "@/components/project-dialog";
import { ApiKeyInput } from "@/components/api-key-input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { AlertCircle, CreditCard } from "lucide-react";
import { logger } from "@/lib/logger";

type AccountFormProps = {
  user: User;
  usage: Usage | null;
};

// Helper functions for credit calculations
function calculateTotalUsedCredits(usage: Usage): number {
  return Math.round(usage.usedSubscriptionCredits + usage.usedPurchasedCredits);
}

function calculateTotalAvailableCredits(usage: Usage): number {
  return Math.round(usage.subscriptionCredits + usage.purchasedCredits);
}

function calculateRemainingCredits(usage: Usage): number {
  return Math.round(
    usage.subscriptionCredits -
      usage.usedSubscriptionCredits +
      (usage.purchasedCredits - usage.usedPurchasedCredits)
  );
}

function calculateUsagePercentage(usage: Usage): number {
  const totalUsed = usage.usedSubscriptionCredits + usage.usedPurchasedCredits;
  const totalAvailable = usage.subscriptionCredits + usage.purchasedCredits;
  return totalAvailable > 0 ? totalUsed / totalAvailable : 0;
}

function getUsageBarColor(usagePercentage: number): string {
  if (usagePercentage >= 0.9) return "bg-destructive";
  if (usagePercentage >= 0.7) return "bg-yellow-500";
  return "bg-brand";
}

function formatPricingPlan(pricingPlan: string | null): string {
  if (!pricingPlan) return "N/A";
  return pricingPlan.charAt(0).toUpperCase() + pricingPlan.slice(1);
}

export function AccountForm({ user, usage }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
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

  async function handleUpdateDisplayName() {
    startTransition(async () => {
      try {
        const response = await updateProfileAction({
          displayName: displayName,
        });

        if (response.success) {
          toast({
            title: "Display Name updated",
            description: "Your display name has been updated.",
          });
        } else {
          logger.error("Update failed:", response.error);
          toast({
            title: "Update failed",
            description: response.error || "Failed to update display name",
            variant: "destructive",
          });
        }
      } catch (error) {
        logger.error("Error updating display name:", error);
        toast({
          title: "Update failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  }

  // Callback for ImageEdit component
  async function handleImageChange(newUrl: string) {
    setAvatarUrl(newUrl); // Update local state for UI immediately

    try {
      const response = await updateAvatarAction({ avatarUrl: newUrl });

      if (response.success) {
        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully.",
        });
      } else {
        logger.error("Failed to update avatar:", response.error);
        toast({
          title: "Update failed",
          description: response.error || "Failed to update avatar",
          variant: "destructive",
        });
        setAvatarUrl(user.avatarUrl); // Revert UI on DB update failure
      }
    } catch (error) {
      logger.error("Error updating avatar:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setAvatarUrl(user.avatarUrl); // Revert UI on catch error
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
      logger.error("Password change error:", e);
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
    <div className="space-y-6 max-w-2xl px-2 py-6">
      <div className="flex justify-center">
        <div className="w-48 flex-shrink-0 flex flex-col items-center px-4">
          <ImageEdit
            initialImageUrl={avatarUrl}
            bucketName="avatars"
            storageFolderPath={`user-avatars/${user.id}`}
            contextId={user.id}
            contextType="user"
            aspectRatio="square"
            onImageChange={handleImageChange}
            imageShape="circle"
            imageContainerClassName="w-36 h-36"
            buttonSize="sm"
            buttonVariant="ghost-brand"
            buttonSpacing="mt-3"
            buttonContainerClassName="w-full flex justify-center"
            showButtonLabels={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 pt-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="displayName" className="text-muted-foreground">
            Display Name
          </Label>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
            <Input
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
            <Button
              type="button"
              variant="ghost-brand"
              onClick={handleUpdateDisplayName}
              disabled={isPending || displayName === (user.displayName ?? "")}
              className="w-24"
            >
              {isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            Email Address
          </Label>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
            <Input
              id="email"
              type="email"
              defaultValue={user.email ?? "No email found"}
              disabled
              className="flex-1 bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
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
                          variant="ghost-brand"
                          disabled={!isEmailProvider}
                          className="w-24"
                        >
                          Password
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
        </div>

        <div className="flex flex-col gap-y-2">
          <Label className="text-muted-foreground">Current Project</Label>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
            <Input
              value={user.currentProject?.name || "No project selected"}
              disabled
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
            <Button
              type="button"
              variant="ghost-brand"
              onClick={() => setShowProjectDialog(true)}
              className="w-24"
            >
              Select
            </Button>
          </div>
          <ProjectDialog
            open={showProjectDialog}
            onOpenChange={setShowProjectDialog}
            currentProjectId={user.currentProject?.id ?? null}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label className="text-muted-foreground">Current Subscription</Label>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
            <Input
              value={formatPricingPlan(user.pricingPlan)}
              disabled
              className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm text-base"
            />
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      variant="ghost-brand"
                      disabled={true}
                      className="w-24"
                    >
                      Manage
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

        <div className="flex flex-col gap-y-2">
          <Label className="text-muted-foreground">Credit Usage</Label>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
            <div className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm p-4 space-y-3">
              {usage ? (
                (() => {
                  const totalUsed = calculateTotalUsedCredits(usage);
                  const totalAvailable = calculateTotalAvailableCredits(usage);
                  const remaining = calculateRemainingCredits(usage);
                  const usagePercentage = calculateUsagePercentage(usage);
                  const barColor = getUsageBarColor(usagePercentage);

                  return (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Credits Used
                        </span>
                        <span className="font-medium">
                          {totalUsed} / {totalAvailable}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            barColor
                          )}
                          style={{
                            width: `${Math.min(usagePercentage * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {remaining} credits remaining
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="text-sm text-muted-foreground">
                  Unable to load credit usage
                </div>
              )}
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      variant="ghost-brand"
                      disabled={true}
                      className="w-24 flex items-center gap-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Add
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
      </div>
      <ApiKeyInput className="bg-secondary/30 rounded-2xl border-border/30 shadow-sm" />
    </div>
  );
}
