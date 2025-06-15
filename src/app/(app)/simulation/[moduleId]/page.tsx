import { notFound } from "next/navigation";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import OpenAIChat from "@/components/openai-chat";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { AI_MODELS } from "@/types/models";
import { Metadata } from "next";
import { logger } from "@/lib/logger";

type Props = {
  params: Promise<{
    moduleId: string;
  }>;
};

// Helper function to avoid code duplication
async function getModule(moduleId: number) {
  try {
    const currentModule = await getModuleByIdAction2(moduleId);
    if (!currentModule) notFound();
    return currentModule;
  } catch (error) {
    logger.error(`Error fetching module ${moduleId}:`, error);
    throw error;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const params = await props.params;
    const moduleId = parseInt(params.moduleId, 10);
    const currentModule = await getModule(moduleId);

    return {
      title: currentModule.title,
    };
  } catch (error) {
    logger.error("Error generating metadata for simulation page:", error);
    return {
      title: "Simulation",
    };
  }
}

export default async function Page(props: Props) {
  try {
    const params = await props.params;
    const moduleId = parseInt(params.moduleId, 10);

    const [currentModule, currentUser] = await Promise.all([
      getModule(moduleId),
      getCurrentUserActionCached(),
    ]);

    const isOpenAIModule =
      currentModule.modulePrompt.aiModel === AI_MODELS.OPENAI;

    return (
      <div className="container mx-auto w-full">
        {isOpenAIModule && (
          <OpenAIChat module={currentModule} currentUser={currentUser} />
        )}
      </div>
    );
  } catch (error) {
    logger.error("Error rendering simulation page:", error);
    throw error; // Re-throw to trigger Next.js error boundary
  }
}
