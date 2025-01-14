import { getEnrolledTrainingsAction } from "@/app/(app)/trainingActions";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";

export default async function TrainingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trainings = await getEnrolledTrainingsAction();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 border-t mt-5">
        <EnrolledTrainingsList trainings={trainings} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
