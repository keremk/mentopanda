import { TrainingGrid } from "@/components/training-grid";
import { getTrainingsWithEnrollmentAction } from "@/app/(app)/trainingActions";

export default async function ExplorePage() {
  const trainings = await getTrainingsWithEnrollmentAction();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Explore Trainings</h1>
      <TrainingGrid trainings={trainings} />
    </div>
  );
}
