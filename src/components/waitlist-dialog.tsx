"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addToWaitingListAction,
  checkEmailInWaitingListAction,
} from "@/app/actions/waiting-list-actions";
import { useToast } from "@/hooks/use-toast";
import { CheckCircleIcon, MailIcon, MessageSquareIcon } from "lucide-react";
import { logger } from "@/lib/logger";

type WaitlistDialogProps = {
  children: React.ReactNode;
};

export function WaitlistDialog({ children }: WaitlistDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if email already exists
      const emailExists = await checkEmailInWaitingListAction(email.trim());

      if (emailExists) {
        setError("This email is already on our waiting list");
        setIsLoading(false);
        return;
      }

      // Add to waiting list
      await addToWaitingListAction(email.trim(), comment.trim() || undefined);

      setIsSuccess(true);
      toast({
        title: "Welcome to the waiting list!",
        description: "We'll notify you when early access becomes available.",
      });

      // Redirect to root page after success
      setTimeout(() => {
        setIsOpen(false);
        router.push("/");
      }, 2000);
    } catch (err) {
      logger.error("Error joining waiting list", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "An error occurred while joining the waiting list. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setEmail("");
      setComment("");
      setError(null);
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Join the Waiting List</DialogTitle>
          <DialogDescription>
            Be the first to know when MentoPanda becomes available. We&apos;ll
            send you an invite code when we&apos;re ready!
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-700 dark:text-green-400">
                You&apos;re on the list!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Redirecting to home page...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address *
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-medium">
                Why would you like to join? (optional)
              </Label>
              <div className="relative">
                <MessageSquareIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="comment"
                  placeholder="Tell us what you're hoping to achieve with MentoPanda..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="pl-10 min-h-[80px] resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ghost-brand"
                disabled={isLoading || !email.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Join Waiting List
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
