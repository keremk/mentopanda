import { getTrainingsWithEnrollmentAction } from "@/app/(app)/trainingActions";
import { TrainingCard } from "@/components/training-card";

export default async function ExplorePage() {
  const trainings = await getTrainingsWithEnrollmentAction();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Explore Trainings</h1>
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
