import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";
import { getModuleByIdAction } from "@/app/(app)/moduleActions";
import { VoiceSimulationComponent } from "@/components/voice-simulation";

type Props = {
  params: {
    moduleId: number;
  };
};

export default async function Page({ params: { moduleId } }: Props) {
  const currentModule = await getModuleByIdAction(moduleId);
  if (!currentModule) notFound();

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{currentModule.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentModule.instructions && (
            <div className="mb-4">
              <MarkdownRenderer content={currentModule.instructions} />
            </div>
          )}

          <VoiceSimulationComponent
            module={currentModule}
          />
        </CardContent>
      </Card>
    </div>
  );
}
