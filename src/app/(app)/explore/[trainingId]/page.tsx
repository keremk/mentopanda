import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EnrollmentButton } from "@/components/enrollment-button";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { Pencil } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

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

export default async function TrainingDetailsPage({
  params,
}: {
  params: { trainingId: string };
}) {
  const training = await getTrainingByIdAction(params.trainingId);

  if (!training) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="absolute top-0 right-0 p-4 z-10">
        <EnrollmentButton className="mr-4" trainingId={training.id} />
        <Button asChild variant="outline">
          <Link
            href={`/explore/${training.id}/edit`}
            className="flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="md:flex md:gap-8 mb-8">
        <div className="flex-1">
          <div className="md:float-right md:ml-8 md:mb-4 w-full md:w-[45%] mb-6">
            <div className="aspect-video relative">
              <Image
                src={training.imageUrl}
                alt={training.title}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-1">{training.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{training.tagline}</p>
          <MarkdownRenderer content={training.description} />
        </div>
      </div>

      {training.previewUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Training Preview</h2>
          <YouTubeEmbed url={training.previewUrl} />
        </div>
      )}

      <div className="text-center">
        <EnrollmentButton trainingId={training.id} />
      </div>
    </div>
  );
}