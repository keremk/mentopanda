import { TrainingSummary } from "@/data/trainings";
import Image from "next/image";
import Link from "next/link";

type EnrolledTrainingsListProps = {
  trainings: TrainingSummary[];
};

export function EnrolledTrainingsList({
  trainings,
}: EnrolledTrainingsListProps) {
  return (
    <div className="w-64 border-r border-border h-full overflow-y-auto">
      <nav className="space-y-1 p-2">
        {trainings.map((training) => (
          <Link
            key={training.id}
            href={`/trainings/${training.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={training.imageUrl}
                alt={training.title}
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
              {training.title}
            </h3>
          </Link>
        ))}
      </nav>
    </div>
  );
}
