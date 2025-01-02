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
      <div className="w-full py-4 px-6 border-b">
        <h1 className="text-2xl font-bold">Enrolled Trainings</h1>
      </div>
      <div className="flex flex-1">
        <EnrolledTrainingsList trainings={trainings} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
