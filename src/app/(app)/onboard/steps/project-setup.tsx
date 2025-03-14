import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useEffect } from "react";
import type { OnboardingData } from "../onboarding-flow";

type ProjectSetupProps = {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
};

export function ProjectSetup({ data, updateData }: ProjectSetupProps) {
  // Set default project name based on display name when component mounts or display name changes
  useEffect(() => {
    if (data.displayName && !data.projectName) {
      updateData({ projectName: `${data.displayName}'s Project` });
    }
  }, [data.displayName, data.projectName, updateData]);

  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="/images/onboarding-project.jpg"
          alt="Project setup visualization"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute top-4 right-4 text-4xl">🐼</div>
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
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={data.projectName}
            onChange={(e) => updateData({ projectName: e.target.value })}
            placeholder={
              data.displayName
                ? `${data.displayName}'s Project`
                : "My First Project"
            }
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="copyStarter"
              checked={data.copyStarterContent}
              onCheckedChange={(checked) =>
                updateData({ copyStarterContent: checked })
              }
            />
            <Label htmlFor="copyStarter">
              Include starter trainings (recommended)
            </Label>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground ml-7">
              <p className="mb-2">
                Our starter pack includes pre-built training sessions and
                characters that will help you:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Have some initial content to work with</li>
                <li>Get familiar with best practices</li>
              </ul>
              <p className="mt-2">
                You can always modify or remove these later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
