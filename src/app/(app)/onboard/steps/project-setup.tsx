import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useEffect } from "react";
import type { OnboardingData } from "../onboarding-flow";

type ProjectSetupProps = {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  hasManuallyEditedProjectName: boolean;
  setHasManuallyEditedProjectName: (value: boolean) => void;
};

export function ProjectSetup({ 
  data, 
  updateData, 
  hasManuallyEditedProjectName, 
  setHasManuallyEditedProjectName 
}: ProjectSetupProps) {
  
  // Set default project name as actual value when component mounts or displayName changes
  // but only if user hasn't manually edited the project name
  useEffect(() => {
    if (!hasManuallyEditedProjectName) {
      const defaultName = data.displayName 
        ? `${data.displayName}'s Project` 
        : "My First Project";
      if (data.projectName !== defaultName) {
        updateData({ projectName: defaultName });
      }
    }
  }, [data.displayName, hasManuallyEditedProjectName, data.projectName, updateData]);

  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-project.jpg"
          alt="Project setup visualization"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">
          Create Your Project
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          Let&apos;s set up your workspace with a new project
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6 pb-6">
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-sm font-medium">
            Project Name
          </Label>
          <Input
            id="projectName"
            value={data.projectName}
            onChange={(e) => {
              setHasManuallyEditedProjectName(true);
              updateData({ projectName: e.target.value });
            }}
            placeholder={
              data.displayName
                ? `${data.displayName}'s Project`
                : "My First Project"
            }
            className="bg-secondary/30 rounded-lg border-border/30 shadow-sm focus:border-brand focus:ring-brand/20"
          />
        </div>

      </div>
    </>
  );
}
