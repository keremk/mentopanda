"use client";

import { useState, useEffect } from "react";
import { useAIPane } from "../contexts/ai-pane-context";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { logger } from "@/lib/logger";

export function AIPaneResponses() {
  const { messages, messagesEndRef, applyGeneratedContent, selectedOption } =
    useAIPane();

  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(
    new Set()
  );

  // Reset applied and copied message IDs when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      setAppliedMessageIds(new Set());
      setCopiedMessageIds(new Set());
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="text-muted-foreground text-sm">
          Ask a question to get started...
        </div>
      </div>
    );
  }

  const handleApplyContent = (messageId: string, content: string) => {
    if (!selectedOption || !applyGeneratedContent) {
      logger.error(
        "Cannot apply content: selectedOption or applyGeneratedContent is undefined"
      );
      return;
    }

    try {
      logger.debug("Applying content to:", selectedOption.targetField);
      logger.debug("Content being applied:", content);

      // Use the targetField from the selected option in context
      applyGeneratedContent(content, selectedOption.targetField);

      // Mark this message as applied
      setAppliedMessageIds((prev) => new Set([...prev, messageId]));
    } catch (error) {
      logger.error("Error applying content:", error);
    }
  };

  const handleCopyContent = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIds((prev) => new Set([...prev, messageId]));

    // Reset the copied status after 2 seconds
    setTimeout(() => {
      setCopiedMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => {
        const isApplied = appliedMessageIds.has(message.id);
        const isCopied = copiedMessageIds.has(message.id);

        return (
          <div
            key={message.id}
            className={`rounded-lg p-4 ${
              message.role === "user"
                ? "bg-primary/5 border border-primary/10"
                : "bg-secondary/30 border border-border/30"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {message.role === "user" ? "You" : "AI Assistant"}
            </div>
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>

            {message.role === "assistant" && (
              <div className="mt-3 flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyContent(message.id, message.content)}
                  className="h-7 px-2 text-xs"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isCopied ? "Copied" : "Copy"}
                </Button>

                {applyGeneratedContent && selectedOption && (
                  <Button
                    size="sm"
                    variant={isApplied ? "brand" : "ghost-brand"}
                    onClick={() =>
                      handleApplyContent(message.id, message.content)
                    }
                    className="h-7 px-2 text-xs"
                    disabled={isApplied}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {isApplied ? "Applied" : "Apply"}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
