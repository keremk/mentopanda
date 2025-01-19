"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatTextEntryProps = {
  onSendMessage: (message: string) => void;
  isEnabled: boolean;
};

export function ChatTextEntry({
  onSendMessage,
  isEnabled,
}: ChatTextEntryProps) {
  const [message, setMessage] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && isEnabled) {
        onSendMessage(message.trim());
        setMessage("");
      }
    }
  };

  const handleSend = () => {
    if (message.trim() && isEnabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className={cn(
          "h-10 py-2 min-h-[2.5rem] max-h-[5rem] resize-none",
          "focus:ring-1 focus:ring-offset-0",
          isEnabled ? "" : "opacity-50 cursor-not-allowed"
        )}
        disabled={!isEnabled}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!isEnabled || !message.trim()}
        className="h-10 w-10 shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
