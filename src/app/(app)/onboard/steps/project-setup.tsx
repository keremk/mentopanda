import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { OnboardingData } from "../onboarding-flow";

type ProjectSetupProps = {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
};

export function ProjectSetup({ data, updateData }: ProjectSetupProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Create Your Project</CardTitle>
        <CardDescription>
          Let&apos;s set up your workspace with a new project
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={data.projectName}
            onChange={(e) => updateData({ projectName: e.target.value })}
            placeholder="My First Project"
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
            <Label htmlFor="copyStarter">Include starter trainings</Label>
          </div>

          <div className="text-sm text-muted-foreground ml-7">
            <p className="mb-2">
              Our starter pack includes pre-built training templates and
              characters that will help you:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Learn the basics of AI training</li>
              <li>Get familiar with best practices</li>
              <li>Start with proven templates</li>
            </ul>
            <p className="mt-2">You can always modify or remove these later.</p>
          </div>
        </div>
      </div>
    </>
  );
}
