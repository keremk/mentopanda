"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createInviteCodesAction } from "@/app/actions/invite-code-actions";
import { z } from "zod";
import { PlusIcon, CopyIcon } from "lucide-react";
import { type InviteCode } from "@/data/invite-codes";
import { logger } from "@/lib/logger";

type GenerateInviteCodesDialogProps = {
  onCodesGenerated: () => void;
  initialCreatedFor?: string;
  children?: React.ReactNode;
};

export function GenerateInviteCodesDialog({
  onCodesGenerated,
  initialCreatedFor,
  children,
}: GenerateInviteCodesDialogProps) {
  const [createdFor, setCreatedFor] = useState(initialCreatedFor || "");
  const [quantity, setQuantity] = useState(5);
  const [expireInDays, setExpireInDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<InviteCode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const quantitySchema = z
    .number()
    .min(1, "Quantity must be at least 1")
    .max(50, "Maximum 50 codes at once");
  const expireSchema = z
    .number()
    .min(1, "Expiration must be at least 1 day")
    .max(365, "Maximum 365 days");

  async function handleGenerate() {
    setError(null);

    try {
      // Validate inputs
      quantitySchema.parse(quantity);
      expireSchema.parse(expireInDays);

      setIsLoading(true);
      const codes = await createInviteCodesAction(
        createdFor.trim() || undefined,
        quantity,
        expireInDays
      );

      setGeneratedCodes(codes);
      setShowResults(true);

      toast({
        title: "Success",
        description: `${codes.length} invite codes generated successfully`,
      });

      onCodesGenerated();
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to generate invite codes");
      }
      toast({
        title: "Error",
        description: error || "Failed to generate invite codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    setCreatedFor(initialCreatedFor || "");
    setQuantity(5);
    setExpireInDays(30);
    setError(null);
    setGeneratedCodes([]);
    setShowResults(false);
    setIsOpen(false);
  }

  function handleClose() {
    if (showResults) {
      setShowResults(false);
      setGeneratedCodes([]);
    }
    handleCancel();
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      logger.error("Error copying code to clipboard", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyAllCodes = async () => {
    try {
      const codesList = generatedCodes.map((c) => c.code).join("\n");
      await navigator.clipboard.writeText(codesList);
      toast({
        title: "Copied",
        description: `All ${generatedCodes.length} codes copied to clipboard`,
      });
    } catch (error) {
      logger.error("Error copying all codes to clipboard", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleBackToForm = () => {
    setShowResults(false);
    setGeneratedCodes([]);
    // Keep the form data for potential re-generation
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-brand text-brand-foreground hover:bg-brand-hover">
            <PlusIcon className="h-4 w-4 mr-2" />
            Generate Codes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!showResults ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate Invite Codes</DialogTitle>
              <DialogDescription>
                Create multiple invite codes with custom expiration settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="createdFor">
                  Created For{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="createdFor"
                  value={createdFor}
                  onChange={(e) => setCreatedFor(e.target.value)}
                  placeholder="e.g., Memorial Day Campaign 2025"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for general use codes or enter a campaign name,
                  event, etc.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expireInDays">Expires in (days)</Label>
                  <Input
                    id="expireInDays"
                    type="number"
                    value={expireInDays}
                    onChange={(e) => setExpireInDays(Number(e.target.value))}
                    min={1}
                    max={365}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || quantity < 1}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
              >
                {isLoading
                  ? "Generating..."
                  : `Generate ${quantity} Code${quantity !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Generated Invite Codes</DialogTitle>
              <DialogDescription>
                {generatedCodes.length} codes generated successfully. Copy them
                now or find them in the table below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generated Codes:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAllCodes}
                  className="text-xs"
                >
                  <CopyIcon className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                {generatedCodes.map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between"
                  >
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {code.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      onClick={() => handleCopyCode(code.code)}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>Details:</strong>
                <br />
                Created For: {createdFor || "General use"}
                <br />
                Quantity: {generatedCodes.length}
                <br />
                Expires: {expireInDays} days from creation
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleBackToForm}>
                Generate More
              </Button>
              <Button
                onClick={handleClose}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
