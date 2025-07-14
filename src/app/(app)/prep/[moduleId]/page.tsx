import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import { getTrainingNoteAction } from "@/app/actions/training-notes-actions";
import { AgentActionsProvider } from "@/contexts/agent-actions-context";
import { notFound } from "next/navigation";
import { PrepPageClient } from "./prep-page-client";

export const metadata: Metadata = {
  title: "Mentor Agent",
};

type Props = {
  params: Promise<{
    moduleId: string;
  }>;
};

export default async function PrepPage(props: Props) {
  // Fetch the actual data objects on the server
  const params = await props.params;
  const moduleId = parseInt(params.moduleId, 10);

  const currentModule = await getModuleByIdAction2(moduleId);

  if (!currentModule) {
    notFound();
  }

  // Check if user has existing notes (not draft)
  const existingNote = await getTrainingNoteAction(moduleId);
  const hasExistingNotes = Boolean(
    existingNote && existingNote.notes && existingNote.notes.trim().length > 0
  );

  // Extract scenario and character prompts for generation
  const scenario = currentModule.modulePrompt.scenario;
  const characterPrompts = currentModule.modulePrompt.characters.map(
    (char) => char.prompt
  );

  return (
    <AgentActionsProvider>
      <div className="container mx-auto px-4 py-2">
        <div className="absolute top-0 right-0 p-4 z-10">
          <div className="flex gap-2">
            <Button asChild variant="ghost-brand">
              <Link href="/home" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild variant="brand" className="hidden md:flex">
              <Link href={`/simulation/${currentModule.id}`}>Continue</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-brand mb-4">
            Prepare for your training
          </h1>
          <div className="w-full max-w-3xl">
            <PrepPageClient
              moduleId={currentModule.id}
              moduleTitle={currentModule.title}
              hasExistingNotes={hasExistingNotes}
              prepCoachPrompt={currentModule.modulePrompt.prepCoach}
              scenario={scenario}
              characterPrompts={characterPrompts}
            />
          </div>
        </div>
      </div>
    </AgentActionsProvider>
  );
}
