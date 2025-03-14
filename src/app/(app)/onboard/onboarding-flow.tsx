"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Welcome } from "./steps/welcome";
import { ProfileSetup } from "./steps/profile-setup";
import { ProjectSetup } from "./steps/project-setup";
import { Summary } from "./steps/summary";
import { Progress } from "./steps/progress";
import { ApiKeySetup } from "./steps/api-key-setup";
import { useRouter } from "next/navigation";
import { setupProjectAction } from "@/app/actions/project-actions";
import { updateProfileAction } from "@/app/actions/user-actions";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/data/user";

export type OnboardingData = {
  projectName: string;
  copyStarterContent: boolean;
  isApiKeyEntered: boolean;
  displayName: string;
  avatarUrl: string;
};

const STEPS = [
  "Welcome",
  "Profile Setup",
  "Project Setup",
  "API Setup",
  "Summary",
  "Progress",
] as const;
type Step = (typeof STEPS)[number];

type OnboardingFlowProps = {
  user: User;
};

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("Welcome");
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    projectName: "",
    copyStarterContent: true,
    isApiKeyEntered: false,
    displayName: user.displayName || "",
    avatarUrl: user.avatarUrl || "",
  });
  const router = useRouter();
  const { toast } = useToast();

  const currentStepIndex = STEPS.indexOf(currentStep);

  async function goToNextStep() {
    if (currentStep === "Summary") {
      setCurrentStep("Progress");
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }

  function goToPreviousStep() {
    const previousIndex = currentStepIndex - 1;
    if (previousIndex >= 0) {
      setCurrentStep(STEPS[previousIndex]);
    }
  }

  function updateData(newData: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...newData }));
  }

  async function handleStartSetup() {
    setStatus("Setting up your workspace...");
    setCurrentStep("Progress");

    try {
      // Update profile if display name has changed
      if (data.displayName && data.displayName !== user.displayName) {
        setStatus("Updating profile information...");
        await updateProfileAction({
          displayName: data.displayName,
        });
      }

      // Set up project
      setStatus("Creating your project...");
      await setupProjectAction({
        projectName: data.projectName,
        copyStarterContent: data.copyStarterContent,
      });

      router.push("/home");
    } catch (error) {
      console.log("Setup failed:", error);
      toast({
        title: "Setup failed",
        description: "Please try again.",
        variant: "destructive",
      });
      setStatus("Setup failed. Please try again.");
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardContent className="pt-6">
          {currentStep === "Welcome" && <Welcome />}
          {currentStep === "Profile Setup" && (
            <ProfileSetup user={user} data={data} updateData={updateData} />
          )}
          {currentStep === "Project Setup" && (
            <ProjectSetup data={data} updateData={updateData} />
          )}
          {currentStep === "API Setup" && (
            <ApiKeySetup data={data} updateData={updateData} />
          )}
          {currentStep === "Summary" && <Summary data={data} />}
          {currentStep === "Progress" && <Progress status={status} />}
        </CardContent>

        <CardFooter className="flex justify-between">
          {currentStepIndex > 0 && currentStep !== "Progress" && (
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          )}
          {currentStepIndex < STEPS.length - 2 && (
            <Button
              className="ml-auto bg-brand text-brand-foreground hover:bg-brand-hover"
              onClick={goToNextStep}
            >
              Next
            </Button>
          )}
          {currentStep === "Summary" && (
            <Button
              className="ml-auto bg-brand text-brand-foreground hover:bg-brand-hover"
              onClick={handleStartSetup}
            >
              Start Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
