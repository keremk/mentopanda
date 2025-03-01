import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";

type SummaryProps = {
  data: OnboardingData;
};

export function Summary({ data }: SummaryProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Ready to Go!</CardTitle>
        <CardDescription>Here&apos;s a summary of your setup</CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Project Name</h3>
            <p className="text-muted-foreground">{data.projectName}</p>
          </div>

          <div>
            <h3 className="font-medium">Starter Content</h3>
            <p className="text-muted-foreground">
              {data.copyStarterContent
                ? "Including starter trainings and templates"
                : "Starting with a clean project"}
            </p>
          </div>

          <div>
            <h3 className="font-medium">API Configuration</h3>
            <p className="text-muted-foreground">
              {data.isApiKeyEntered
                ? "OpenAI API key configured"
                : "No API key provided (some features will be limited)"}
            </p>
          </div>

        </div>

        <p className="text-sm text-muted-foreground">
          Click &quot;Start Setup&quot; below to create your project and get
          started!
        </p>
      </div>
    </>
  );
}
