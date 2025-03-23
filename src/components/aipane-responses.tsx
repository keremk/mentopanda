"use client";

import { useState, useEffect } from "react";
import { useAIPane } from "../contexts/ai-pane-context";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Message } from "@ai-sdk/react";

// Added for type safety
interface ExtendedMessage extends Omit<Message, "data"> {
  data?: {
    selectedOption?: {
      targetField?: string;
    };
  };
}

export function AIPaneResponses() {
  const { messages, messagesEndRef, applyGeneratedContent } = useAIPane();
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

  const handleApplyContent = (
    messageId: string,
    content: string,
    targetField?: string
  ) => {
    if (!targetField || !applyGeneratedContent) return;

    applyGeneratedContent(content, targetField);
    setAppliedMessageIds((prev) => new Set([...prev, messageId]));
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
      {messages.map((message, index) => {
        // Get targetField if this is an assistant message responding to a user message
        let targetField: string | undefined = undefined;

        if (message.role === "assistant" && index > 0) {
          // Try to get the targetField from the previous message's data
          const prevMessage = messages[index - 1] as ExtendedMessage;
          targetField = prevMessage.data?.selectedOption?.targetField;
        }

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

                {targetField && applyGeneratedContent && (
                  <Button
                    size="sm"
                    variant={isApplied ? "brand" : "ghost-brand"}
                    onClick={() =>
                      handleApplyContent(
                        message.id,
                        message.content,
                        targetField
                      )
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
