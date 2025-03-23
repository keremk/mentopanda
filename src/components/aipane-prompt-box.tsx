"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Globe, Lightbulb } from "lucide-react";
import {
  useAIPane,
  FocusedField,
  SelectedOption,
} from "@/contexts/ai-pane-context";

type AIPanePromptBoxProps = {
  className?: string;
};

export type AIAssistOption = {
  id: string;
  label: string;
  targetField: string;
};

export function AIPanePromptBox({ className = "" }: AIPanePromptBoxProps) {
  const {
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    contextType,
    focusedField,
    selectedOption,
    setSelectedOption,
  } = useAIPane();

  // Define options based on context
  const options: AIAssistOption[] = getOptionsForContext(contextType);

  // Auto-select appropriate option when focused field changes
  useEffect(() => {
    if (focusedField) {
      const matchingOption = findOptionForField(options, focusedField);
      if (matchingOption) {
        // Only update if different from current selection to prevent infinite loops
        if (!selectedOption || selectedOption.id !== matchingOption.id) {
          const option: SelectedOption = {
            id: matchingOption.id,
            label: matchingOption.label,
            targetField: matchingOption.targetField,
          };
          setSelectedOption(option);
        }
      }
    }
  }, [focusedField, options, setSelectedOption, selectedOption]);

  const handleOptionClick = (optionId: string) => {
    // Find the selected option object and set it in context
    const option = options.find((opt) => opt.id === optionId);
    if (option) {
      setSelectedOption({
        id: option.id,
        label: option.label,
        targetField: option.targetField,
      });
    }

    // Focus the textarea automatically with a delay to ensure the DOM is updated
    setTimeout(() => {
      const form = document.querySelector(".aipane-form");
      if (form) {
        const textareaElement = form.querySelector("textarea");
        if (textareaElement) {
          textareaElement.focus();
        }
      }
    }, 50);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Just submit with the regular form - we don't need to pass selectedOption here anymore
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
          What would you like help with?
        </h4>
        <div className="flex flex-wrap gap-1.5 aipane-options">
          {options.map((option) => (
            <Button
              key={option.id}
              variant={
                selectedOption?.id === option.id ? "brand" : "ghost-brand"
              }
              size="sm"
              className="text-xs h-7 px-2 py-0"
              onClick={() => handleOptionClick(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-3 aipane-form">
        <div className="rounded-2xl bg-secondary/30 border border-border/30 overflow-hidden flex flex-col group focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
              selectedOption
                ? `Additional instructions for ${selectedOption.label.toLowerCase()}...`
                : "Select an option above and add any specific instructions..."
            }
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
              disabled={isLoading || !selectedOption}
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

// Function to get options based on context
function getOptionsForContext(contextType?: string): AIAssistOption[] {
  switch (contextType) {
    case "scenario":
    case "assessment":
    case "module":
      // For module editing context
      return [
        {
          id: "generateModuleTitle",
          label: "Generate a title",
          targetField: "title",
        },
        {
          id: "generateModuleInstructions",
          label: "Generate user facing instructions",
          targetField: "instructions",
        },
        {
          id: "generateScenario",
          label: "Generate a scenario",
          targetField: "scenario",
        },
        {
          id: "generateAssessment",
          label: "Generate assessment instructions",
          targetField: "assessment",
        },
        {
          id: "generateCharacterPrompt",
          label: "Generate character prompt",
          targetField: "characterPrompt",
        },
      ];
    case "character":
      // Character editing options
      return [
        {
          id: "generateCharacterName",
          label: "Generate character name",
          targetField: "title",
        },
        {
          id: "generateCharacterDescription",
          label: "Generate character description",
          targetField: "description",
        },
        {
          id: "generateAIDescription",
          label: "Generate AI description",
          targetField: "aiDescription",
        },
      ];
    case "training":
      return [
        {
          id: "generateTrainingTitle",
          label: "Generate a title",
          targetField: "title",
        },
        {
          id: "generateTrainingTagline",
          label: "Generate a tagline",
          targetField: "tagline",
        },
        {
          id: "generateTrainingDescription",
          label: "Generate a training description",
          targetField: "description",
        },
      ];
    default:
      return [];
  }
}

// Find the matching option for a focused field
function findOptionForField(
  options: AIAssistOption[],
  focusedField: FocusedField
): AIAssistOption | undefined {
  // Direct match by target field
  const directMatch = options.find(
    (option) => option.targetField === focusedField.fieldType
  );
  if (directMatch) return directMatch;

  // Fuzzy match by looking at the field ID
  if (focusedField.fieldId.includes("title")) {
    return options.find((option) => option.targetField === "title");
  }
  if (focusedField.fieldId.includes("tagline")) {
    return options.find((option) => option.targetField === "tagline");
  }
  if (focusedField.fieldId.includes("description")) {
    return options.find((option) => option.targetField === "description");
  }
  if (focusedField.fieldId.includes("instructions")) {
    return options.find((option) => option.targetField === "instructions");
  }
  if (focusedField.fieldId.includes("scenario")) {
    return options.find((option) => option.targetField === "scenario");
  }
  if (focusedField.fieldId.includes("assessment")) {
    return options.find((option) => option.targetField === "assessment");
  }
  if (focusedField.fieldId.includes("character-prompt")) {
    return options.find((option) => option.targetField === "characterPrompt");
  }

  return undefined;
}

export default AIPanePromptBox;
