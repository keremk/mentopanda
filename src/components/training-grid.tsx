import { TrainingCard } from "@/components/training-card";
import { Training } from "@/data/trainings";

interface TrainingGridProps {
  trainings: Training[];
}

export function TrainingGrid({ trainings }: TrainingGridProps) {
  return (
    <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {trainings.map((training) => (
        <TrainingCard
          key={training.id}
          id={training.id}
          title={training.title}
          tagline={training.tagline}
          imageUrl={training.image_url}
        />
      ))}
    </div>
  );
}
