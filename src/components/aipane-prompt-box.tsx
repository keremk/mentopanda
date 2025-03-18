"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Globe, Lightbulb } from "lucide-react";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

type AIPanePromptBoxProps = {
  className?: string;
};

export function AIPanePromptBox({ className = "" }: AIPanePromptBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    "Improve my scenario description",
    "Help me create a more challenging assessment",
    "Generate realistic dialogue for my character",
    "Make my instructions clearer for users",
  ]);

  const handleSuggestionClick = (suggestion: string) => {
    // This will be implemented in future iterations
    console.log(`Selected suggestion: ${suggestion}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (to be replaced with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "This is a placeholder response. The AI integration will be implemented in future iterations.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-2.5 border-b border-border/20">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 px-1">
          <Lightbulb className="h-3 w-3" />
          Suggestions
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost-brand"
              size="sm"
              className="text-xs h-7 px-2 py-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-3">
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-secondary/30 border border-border/30 overflow-hidden flex flex-col group focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between bg-secondary/40 px-3 py-1.5 border-t border-border/20">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground/70 hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="submit"
                variant="ghost-brand"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="h-7 rounded-full px-3 flex items-center gap-1 text-xs"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                <span>Send</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIPanePromptBox;
