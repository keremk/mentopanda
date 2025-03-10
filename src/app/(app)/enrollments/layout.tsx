import { getEnrolledTrainingsAction } from "@/app/actions/enrollment-actions";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";

export async function getSharedData() {
  const trainings = await getEnrolledTrainingsAction();
  return trainings;
}

export default async function TrainingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trainings = await getSharedData();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] py-2">
      <div className="flex flex-1 border-t h-full overflow-hidden">
        <EnrolledTrainingsList trainings={trainings} />
        <div className="flex-1 overflow-y-auto w-full">{children}</div>
      </div>
    </div>
  );
}
