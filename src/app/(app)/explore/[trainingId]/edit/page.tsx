import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";

export default async function EditTrainingPage({
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
        <Button type="submit" form="training-form">
          Save Changes
        </Button>
      </div>

      {/* We'll implement the edit form in the next iteration */}
      <form id="training-form">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{training.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{training.tagline}</p>
          <div className="aspect-video relative mb-4">
            <Image
              src={training.imageUrl}
              alt={training.title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Training Description</h2>
          <p className="text-gray-700">{training.description}</p>
        </div>
      </form>
    </div>
  );
}
