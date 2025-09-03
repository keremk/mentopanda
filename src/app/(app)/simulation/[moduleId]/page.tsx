import { notFound } from "next/navigation";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import RolePlaySimulation from "@/components/role-play-simulation";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { getTrainingNoteAction } from "@/app/actions/training-notes-actions";
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

    const [currentModule, currentUser, trainingNote] = await Promise.all([
      getModule(moduleId),
      getCurrentUserActionCached(),
      getTrainingNoteAction(moduleId).catch(() => null), // Notes are optional
    ]);

    return (
      <div className="container mx-auto w-full">
        <RolePlaySimulation 
          module={currentModule} 
          currentUser={currentUser}
          notes={trainingNote?.notes || null}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error rendering simulation page:", error);
    throw error; // Re-throw to trigger Next.js error boundary
  }
}
