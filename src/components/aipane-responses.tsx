"use client";

import { useAIPane } from "./ai-pane-context";

export function AIPaneResponses() {
  const { messages, messagesEndRef } = useAIPane();

  if (messages.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="text-muted-foreground text-sm">
          Ask a question to get started...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => (
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
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
