import { getTrainingsWithEnrollmentAction } from "@/app/actions/trainingActions";
import { TrainingCard } from "@/components/training-card";
import { Metadata } from "next";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { CreateTrainingButton } from "@/components/create-training-button";

export const metadata: Metadata = {
  title: "Trainings Catalog",
};

export default async function ExplorePage() {
  const [trainings, user] = await Promise.all([
    getTrainingsWithEnrollmentAction(),
    getCurrentUserActionCached(),
  ]);

  return (
    <div className="py-2">
      {user.permissions.includes("training.manage") && (
        <div className="absolute top-0 right-0 p-4 z-10">
          <CreateTrainingButton needsOrganization={false} />
        </div>
      )}

      <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t py-6">
        {trainings.map((training, index) => (
          <TrainingCard
            key={training.id}
            id={training.id}
            title={training.title}
            tagline={training.tagline}
            imageUrl={training.imageUrl}
            isEnrolled={training.isEnrolled}
            priority={index < 6}
          />
        ))}
      </div>
    </div>
  );
}
