import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentButton } from "@/components/enrollment-button";
import { getTrainingByIdAction } from "@/app/actions/trainingActions";
import { Pencil } from "lucide-react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ThemedImage } from "@/components/themed-image";

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
  const training = await getTrainingByIdAction(params.trainingId);

  if (!training) {
    notFound();
  }

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
        <EnrollmentButton
          className="ml-4"
          trainingId={training.id}
          variant="brand"
        />
      </div>

      <div className="md:flex md:gap-8 mb-8">
        <div className="flex-1">
          <div className="md:float-right md:ml-8 md:mb-4 w-full md:w-[45%] mb-6">
            <div className="aspect-video relative">
              <ThemedImage
                lightSrc={training.imageUrl || "/placeholder-training.svg"}
                darkSrc={training.imageUrl || "/placeholder-training-dark.svg"}
                alt={training.title}
                fill
                className="rounded-lg"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-1">{training.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{training.tagline || ""}</p>
          <MemoizedMarkdown content={training.description || ""} />
        </div>
      </div>

      {training.previewUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Training Preview</h2>
          <YouTubeEmbed url={training.previewUrl} />
        </div>
      )}
    </div>
  );
}
