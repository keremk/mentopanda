"use client";

import { TrainingSummary } from "@/data/trainings";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UnenrollButton } from "@/components/unenroll-button";
import { useParams } from "next/navigation";

type EnrolledTrainingsListProps = {
  trainings: TrainingSummary[];
};

export function EnrolledTrainingsList({
  trainings,
}: EnrolledTrainingsListProps) {
  const params = useParams();
  const selectedTrainingId = params.trainingId as string;

  const selectedTrainingIndex = trainings.findIndex(
    (t) => t.id.toString() === selectedTrainingId
  );

  const selectedTraining =
    selectedTrainingIndex !== -1 ? trainings[selectedTrainingIndex] : undefined;

  const nextTraining =
    selectedTrainingIndex !== -1
      ? trainings[selectedTrainingIndex + 1] ||
        trainings[selectedTrainingIndex - 1]
      : undefined;

  return (
    <div className="w-64 border-r border-border h-full flex flex-col">
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
      <div className="p-2 border-t border-border bg-background">
        <div className="flex gap-2">
          <Link href="/explore" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </Link>
          <UnenrollButton
            trainingId={selectedTraining?.id}
            trainingTitle={selectedTraining?.title}
            nextTrainingId={nextTraining?.id}
            disabled={!selectedTraining}
          />
        </div>
      </div>
    </div>
  );
}
