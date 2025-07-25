"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAIPane,
  FocusedField,
  SelectedOption,
} from "@/contexts/ai-pane-context";
import { Checkbox } from "@/components/ui/checkbox";

type AIPanePromptBoxProps = {
  className?: string;
};

export type AIAssistOption = {
  id: string;
  label: string;
  targetField: string;
  targetTab?: string;
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
    onTabSwitch,
    error,
    showNoCreditsDialog,
  } = useAIPane();

  const [isContextIncluded, setIsContextIncluded] = useState(true);

  // Define options based on context
  const options: AIAssistOption[] = getOptionsForContext(contextType);

  // Check if there's a credit-related error
  const hasCreditError =
    error &&
    (error.message.includes("No credits available") ||
      error.message.includes("402") ||
      showNoCreditsDialog);

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
            // Don't include targetTab here to avoid automatic switching
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
      // If this option has a target tab, switch to it immediately
      if (option.targetTab && onTabSwitch) {
        onTabSwitch(option.targetTab);
      }

      // Set the selected option without targetTab to prevent repeated switches
      setSelectedOption({
        id: option.id,
        label: option.label,
        targetField: option.targetField,
        // Don't include targetTab here to avoid the useEffect triggering
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
    if (isLoading || (!input.trim() && !isContextIncluded) || hasCreditError)
      return;

    // Submit with the selected option
    handleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit the form on Cmd+Enter or Ctrl+Enter
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();

      // Don't submit if there's a credit error
      if (hasCreditError) return;

      // Simply submit the form directly
      const formElement = e.currentTarget.closest("form");
      if (formElement) {
        formElement.requestSubmit();
      }
    }
    // Pressing Enter alone will now insert a newline by default
  };

  const isAskEnabled = (isContextIncluded || !!input.trim()) && !hasCreditError;

  return (
    <TooltipProvider>
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
                disabled={hasCreditError}
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
                hasCreditError
                  ? "No credits available - purchase credits to continue..."
                  : selectedOption
                    ? `Additional instructions for ${selectedOption.label.toLowerCase()}...`
                    : "Select an option above and add any specific instructions..."
              }
              className="flex-1 h-[40px] max-h-[80px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={handleKeyDown}
              disabled={hasCreditError}
            />
            <div className="flex items-center justify-between bg-secondary/40 px-3 py-1.5 border-t border-border/20">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="context-toggle"
                  className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none"
                >
                  <Checkbox
                    id="context-toggle"
                    checked={isContextIncluded}
                    onCheckedChange={(checked) =>
                      setIsContextIncluded(!!checked)
                    }
                    className="h-5 w-5 border-border data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                    disabled={hasCreditError}
                  />
                  Include context
                </label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost-brand"
                    size="sm"
                    disabled={isLoading || !selectedOption || !isAskEnabled}
                    className="h-7 rounded-full px-3 flex items-center gap-1 text-xs"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>
                      {hasCreditError
                        ? "No Credits"
                        : isLoading
                          ? "Generating..."
                          : "Ask"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {hasCreditError
                      ? "Purchase credits to continue"
                      : "Cmd+Enter to send"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
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
          // No targetTab - title is not in any tab
        },
        {
          id: "generateModuleInstructions",
          label: "Generate user facing instructions",
          targetField: "instructions",
          targetTab: "instructions",
        },
        {
          id: "generateScenario",
          label: "Generate a scenario",
          targetField: "scenario",
          targetTab: "scenario",
        },
        {
          id: "generateAssessment",
          label: "Generate assessment instructions",
          targetField: "assessment",
          targetTab: "assessment",
        },
        {
          id: "generateCharacterName",
          label: "Generate character name",
          targetField: "characterName",
          targetTab: "character",
        },
        {
          id: "generateCharacterPrompt",
          label: "Generate character prompt",
          targetField: "characterPrompt",
          targetTab: "character",
        },
        {
          id: "generatePrepCoach",
          label: "Generate prep coach prompt",
          targetField: "prepCoach",
          targetTab: "prepCoach",
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
  return options.find(
    (option) => option.targetField === focusedField.fieldType
  );
}

export default AIPanePromptBox;
