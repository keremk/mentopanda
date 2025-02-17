"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyInput } from "@/components/api-key-input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { OnboardingData } from "@/app/(app)/onboard/onboarding-flow";

type ApiKeySetupProps = {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
};

export function ApiKeySetup({ updateData }: ApiKeySetupProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleApiKeyChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const hasKey = !!event.target.value;
    updateData({ isApiKeyEntered: hasKey });
  }

  return (
    <>
      <CardHeader>
        <CardTitle>API Key Setup</CardTitle>
        <CardDescription>Configure your OpenAI API access</CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6">
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium mb-2">Coming Soon: MentoPanda Pro</p>
            <p className="text-sm text-muted-foreground">
              With our Pro plan, you won&apos;t need to provide your own API
              key. We will handle all API costs and management for you.
            </p>
          </div>

          <ApiKeyInput showRemoveButton={false} onChange={handleApiKeyChange} />

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 w-full justify-start p-0"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>Why do I need an API key?</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2 text-sm text-muted-foreground">
              <p>
                MentoPanda uses OpenAI&apos;s API to power its AI features. Your
                API key allows us to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Make API calls on behalf of your account</li>
                <li>
                  Ensure you have full control over your API usage and costs
                </li>
                <li>Keep your data private and secure</li>
              </ul>
              <p className="mt-4">
                You can get your API key from the{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI dashboard
                </a>
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </>
  );
}
