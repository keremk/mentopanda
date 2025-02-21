"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Welcome } from "./steps/welcome";
import { ProjectSetup } from "./steps/project-setup";
import { InviteTeam } from "./steps/invite-team";
import { Summary } from "./steps/summary";
import { Progress } from "./steps/progress";
import { ApiKeySetup } from "./steps/api-key-setup";
import { useRouter } from "next/navigation";
import { setupProjectAction } from "@/app/actions/project-actions";

export type OnboardingData = {
  projectName: string;
  copyStarterContent: boolean;
  teamEmails: string[];
  isApiKeyEntered: boolean;
};

const STEPS = [
  "Welcome",
  "Project Setup",
  "API Setup",
  "Invite Team",
  "Summary",
  "Progress",
] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("Welcome");
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    projectName: "",
    copyStarterContent: true,
    teamEmails: [],
    isApiKeyEntered: false,
  });
  const router = useRouter();

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
      // Only pass the required data for project setup
      await setupProjectAction({
        projectName: data.projectName,
        copyStarterContent: data.copyStarterContent
      });
      router.push("/home");
    } catch (error) {
      console.error("Setup failed:", error);
      setStatus("Setup failed. Please try again.");
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardContent className="pt-6">
          {currentStep === "Welcome" && <Welcome />}
          {currentStep === "Project Setup" && (
            <ProjectSetup data={data} updateData={updateData} />
          )}
          {currentStep === "API Setup" && (
            <ApiKeySetup data={data} updateData={updateData} />
          )}
          {currentStep === "Invite Team" && (
            <InviteTeam data={data} updateData={updateData} />
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
            <Button className="ml-auto" onClick={goToNextStep}>
              Next
            </Button>
          )}
          {currentStep === "Summary" && (
            <Button className="ml-auto" onClick={handleStartSetup}>
              Start Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
