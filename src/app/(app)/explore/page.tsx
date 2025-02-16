import { getTrainingsWithEnrollmentAction } from "@/app/(app)/trainingActions";
import { TrainingCard } from "@/components/training-card";
import { Metadata } from "next";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { CreateTrainingButton } from "@/components/create-training-button";

export const metadata: Metadata = {
  title: "Trainings Catalog",
};

export default async function ExplorePage() {
  const [trainings, user] = await Promise.all([
    getTrainingsWithEnrollmentAction(),
    getCurrentUserAction(),
  ]);

  return (
    <div className="p-4">
      {user.permissions.includes("training.manage") && (
        <div className="absolute top-0 right-0 p-4 z-10">
          <CreateTrainingButton needsOrganization={false} />
        </div>
      )}

      <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 border-t py-6">
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
