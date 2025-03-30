"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyInput } from "@/components/api-key-input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
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
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-apikey.jpg"
          alt="API key setup visualization"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute top-4 right-4 text-4xl">🐼</div>
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">API Key Setup</CardTitle>
        <CardDescription className="text-lg mt-2">
          Configure your OpenAI API access
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6 pb-6">
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <p className="font-medium">Coming Soon: MentoPanda Pro</p>
            </div>
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
