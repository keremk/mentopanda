import { notFound } from "next/navigation";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import OpenAIChat from "@/components/openai-chat";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { AI_MODELS } from "@/types/models";
import { Metadata } from "next";
import { ApiKeyCheckDialog } from "@/components/api-key-check-dialog";
import { TranscriptProvider } from "@/contexts/transcript";

type Props = {
  params: Promise<{
    moduleId: string;
  }>;
};

// Helper function to avoid code duplication
async function getModule(moduleId: number) {
  const currentModule = await getModuleByIdAction2(moduleId);
  if (!currentModule) notFound();
  return currentModule;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const moduleId = parseInt(params.moduleId, 10);
  const currentModule = await getModule(moduleId);

  return {
    title: currentModule.title,
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const moduleId = parseInt(params.moduleId, 10);
  const [currentModule, currentUser] = await Promise.all([
    getModule(moduleId),
    getCurrentUserAction(),
  ]);

  const isOpenAIModule =
    currentModule.modulePrompt.aiModel === AI_MODELS.OPENAI;

  return (
    <div className="container mx-auto w-full">
      <ApiKeyCheckDialog
        isOpenAIModule={isOpenAIModule}
        user={currentUser}
      />

      {isOpenAIModule && (
        <TranscriptProvider>
          <OpenAIChat module={currentModule} currentUser={currentUser} />
        </TranscriptProvider>
      )}
    </div>
  );
}
