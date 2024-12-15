import { getTrainingsWithEnrollmentAction } from "@/app/(app)/trainingActions";
import { TrainingCard } from "@/components/training-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createTrainingAction } from "@/app/(app)/trainingActions";

export default async function ExplorePage() {
  const trainings = await getTrainingsWithEnrollmentAction();

  return (
    <div className="p-4">
      <div className="absolute top-0 right-0 p-4 z-10">
        <form action={createTrainingAction}>
          <Button type="submit" variant="outline" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Create Training
          </Button>
        </form>
      </div>

      <h1 className="text-2xl font-bold mb-4">Trainings Catalog</h1>
      <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {trainings.map((training) => (
          <TrainingCard
            key={training.id}
            id={training.id}
            title={training.title}
            tagline={training.tagline}
            imageUrl={training.imageUrl}
            isEnrolled={training.isEnrolled}
          />
        ))}
      </div>
    </div>
  );
}
