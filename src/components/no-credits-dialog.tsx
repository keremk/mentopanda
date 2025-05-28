"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Home } from "lucide-react";
import { useRouter } from "next/navigation";

type NoCreditsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function NoCreditsDialog({
  isOpen,
  onOpenChange,
  title = "No Credits Available",
  description = "You don't have enough credits to continue this operation. Purchase additional credits to continue using AI features.",
}: NoCreditsDialogProps) {
  const router = useRouter();

  const handleBuyCredits = () => {
    // TODO: Navigate to credits purchase page when implemented
    console.log("Buy credits clicked - to be implemented");
  };

  const handleGoHome = () => {
    onOpenChange(false);
    router.push("/home");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex-col gap-3 mt-6">
            <Button
              variant="brand"
              onClick={handleBuyCredits}
              className="w-full"
              size="lg"
            >
              Buy Credits
            </Button>
            <Button
              variant="ghost-brand"
              onClick={handleGoHome}
              className="w-full"
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
