"use client";

import { TrainingSummary } from "@/data/trainings";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";

type EnrolledTrainingsListProps = {
  trainings: TrainingSummary[];
};

export function EnrolledTrainingsList({
  trainings,
}: EnrolledTrainingsListProps) {
  const params = useParams();
  const selectedTrainingId = params.trainingId as string;
  const { resolvedTheme } = useTheme();
  const fallbackImage =
    resolvedTheme === "dark"
      ? "/placeholder-training-dark.svg"
      : "/placeholder-training.svg";

  return (
    <div className="w-full md:w-64 border-r border-border h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 p-2">
          {trainings.map((training) => (
            <Link
              key={training.id}
              href={`/enrollments/${training.id}`}
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors
                ${
                  training.id.toString() === selectedTrainingId
                    ? "bg-accent"
                    : ""
                }`}
            >
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src={training.imageUrl || fallbackImage}
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
    </div>
  );
}
