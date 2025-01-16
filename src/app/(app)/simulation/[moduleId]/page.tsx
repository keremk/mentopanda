import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { getModuleByIdAction2 } from "@/app/(app)/moduleActions";
import CollapsibleBlock from "@/components/collapsible-block";
import OpenAIChat from "@/components/openai-chat";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { AI_MODELS } from "@/types/models";
import { Metadata } from "next";

type Props = {
  params: {
    moduleId: string;
  };
};

// Helper function to avoid code duplication
async function getModule(moduleId: number) {
  const module = await getModuleByIdAction2(moduleId);
  if (!module) notFound();
  return module;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const moduleId = parseInt(params.moduleId, 10);
  const currentModule = await getModule(moduleId);

  return {
    title: currentModule.title,
  };
}

export default async function Page({ params }: Props) {
  const moduleId = parseInt(params.moduleId, 10);
  const [currentModule, currentUser] = await Promise.all([
    getModule(moduleId),
    getCurrentUserAction(),
  ]);

  return (
    <div className="container mx-auto py-8 w-full max-w-4xl">
      {currentModule.modulePrompt.aiModel === AI_MODELS.OPENAI && (
        <OpenAIChat module={currentModule} currentUser={currentUser} />
      )}
      {currentModule.instructions && (
        <CollapsibleBlock>
          <div className="mb-4">
            <MarkdownRenderer content={currentModule.instructions} />
          </div>
        </CollapsibleBlock>
      )}
    </div>
  );
}
