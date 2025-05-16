import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrainingByIdForEditAction } from "@/app/actions/trainingActions";
import { Pencil } from "lucide-react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ThemedImage } from "@/components/themed-image";
import { CharacterDetailsView } from "@/components/character-details";
import type { CharacterDetails } from "@/data/characters";
import { AI_MODELS } from "@/types/models";
import { isEnrolledAction } from "@/app/actions/enrollment-actions";
import { TrainingActionsRow } from "@/components/training-actions-row";

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = url.split("v=")[1];
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="aspect-video">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
      ></iframe>
    </div>
  );
}

export default async function TrainingDetailsPage(props: {
  params: Promise<{ trainingId: number }>;
}) {
  const params = await props.params;
  const training = await getTrainingByIdForEditAction(params.trainingId);

  if (!training) {
    notFound();
  }

  const isCurrentlyEnrolled = await isEnrolledAction(training.id);

  const displayModules = training.modules || [];

  const displayCharacters: CharacterDetails[] = (training.modules || []).reduce<
    CharacterDetails[]
  >((acc, module) => {
    const moduleAiModel = module.modulePrompt?.aiModel || AI_MODELS.OPENAI;
    const charactersInModule = module.modulePrompt?.characters || [];
    charactersInModule.forEach((charSource) => {
      if (!acc.find((c) => c.id === charSource.id)) {
        acc.push({
          id: charSource.id,
          name: charSource.name,
          avatarUrl: charSource.avatarUrl || null,
          voice: charSource.voice || null,
          description:
            charSource.description ||
            "No specific information for this context.",
          aiModel: moduleAiModel,
          aiDescription: null,
          projectId: training.projectId,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
    return acc;
  }, []);

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="absolute top-0 right-0 p-4 z-10">
        <Button asChild variant="ghost-brand">
          <Link
            href={`/explore/${training.id}/edit`}
            className="flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="mx-6">
        <div className="md:flex md:gap-8 mb-8">
          <div className="flex-1">
            <div className="md:float-right md:ml-8 md:mb-4 w-full md:w-[45%] mb-6">
              <div className="aspect-video relative">
                <ThemedImage
                  lightSrc={training.imageUrl || "/placeholder-training.svg"}
                  darkSrc={
                    training.imageUrl || "/placeholder-training-dark.svg"
                  }
                  alt={training.title}
                  fill
                  className="rounded-lg"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
              </div>
              <div className="mt-4 space-y-2">
                <TrainingActionsRow
                  trainingId={training.id}
                  initialIsEnrolled={isCurrentlyEnrolled}
                  enrollmentButtonVariant="brand"
                  enrollmentButtonClassName="w-full"
                  trainButtonClassName="w-full"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-1">{training.title}</h1>
            <p className="text-xl text-gray-600 mb-6">
              {training.tagline || ""}
            </p>
            <MemoizedMarkdown content={training.description || ""} />
          </div>
        </div>

        {/* Modules and Characters Sections */}
        {(displayModules.length > 0 || displayCharacters.length > 0) && (
          <div className="my-8 flex flex-col space-y-8">
            {/* Modules Section - Always on top, full width */}
            {displayModules.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Modules</h2>
                <div className="bg-card border rounded-lg p-6 shadow">
                  <ul className="space-y-3 list-disc list-inside pl-2">
                    {displayModules.map((module) => (
                      <li key={module.id} className="text-card-foreground">
                        {module.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Characters Section - Below modules, responsive grid */}
            {displayCharacters.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Characters</h2>
                {/* Responsive grid for characters: 1 on mobile, 2 on sm, up to 4 on xl */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayCharacters.map((character) => (
                    <CharacterDetailsView
                      key={character.id}
                      character={character}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {training.previewUrl && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Training Preview</h2>
            <YouTubeEmbed url={training.previewUrl} />
          </div>
        )}
      </div>
    </div>
  );
}
