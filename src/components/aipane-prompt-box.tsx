"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Globe, Lightbulb } from "lucide-react";
import { useAIPane } from "../contexts/ai-pane-context";

type AIPanePromptBoxProps = {
  className?: string;
};

export function AIPanePromptBox({ className = "" }: AIPanePromptBoxProps) {
  const { input, handleInputChange, handleSubmit, isLoading } = useAIPane();
  const [suggestions] = useState([
    "Improve my scenario description",
    "Help me create a more challenging assessment",
    "Generate realistic dialogue for my character",
    "Make my instructions clearer for users",
  ]);

  const handleSuggestionClick = (suggestion: string) => {
    // This would be implemented in future iterations
    console.log(`Selected suggestion: ${suggestion}`);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Simply submit the form directly
      const formElement = e.currentTarget.closest("form");
      if (formElement) {
        formElement.requestSubmit();
      }
    }
  };

  return (
    <div className={`border-t border-border/20 ${className}`}>
      <div className="p-2 border-b border-border/20 bg-secondary/10">
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

      <form onSubmit={onSubmit} className="p-3">
        <div className="rounded-2xl bg-secondary/30 border border-border/30 overflow-hidden flex flex-col group focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="flex-1 h-[40px] max-h-[80px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={handleKeyDown}
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
              <span>{isLoading ? "Sending..." : "Send"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AIPanePromptBox;
