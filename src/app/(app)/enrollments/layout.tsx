import { getEnrolledTrainingsActionCached } from "@/app/actions/enrollment-actions";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";

export default async function TrainingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserActionCached();
  const trainings = await getEnrolledTrainingsActionCached(user);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] py-2">
      <div className="flex flex-1 border-t h-full overflow-hidden">
        <div className="hidden md:block">
          <EnrolledTrainingsList trainings={trainings} />
        </div>
        <div className="flex-1 overflow-y-auto w-full">{children}</div>
      </div>
    </div>
  );
}
