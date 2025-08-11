import { getPublicTrainingsAction } from "@/app/actions/trainingActions";
import { TrainingCard } from "@/components/training-card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Training Catalog",
};

export default async function PublicTrainingsPage() {
  const publicTrainings = await getPublicTrainingsAction();

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Training Catalog</h1>
          <p className="text-xl text-muted-foreground">
            Discover our collection of professional development trainings
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publicTrainings.map((training, index) => (
            <TrainingCard
              key={training.id}
              id={training.id}
              title={training.title}
              tagline={training.tagline}
              imageUrl={training.imageUrl}
              isEnrolled={false}
              priority={index < 6}
              isPublic={true}
              isEnrollable={false}
              isForked={training.isForked}
              basePath="/trainings"
            />
          ))}
        </div>
        
        {publicTrainings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No public trainings available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}