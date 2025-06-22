import { Metadata } from "next";
import { getEnrolledTrainingsActionCached } from "@/app/actions/enrollment-actions";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";
import { DesktopRedirector } from "./desktop-redirector";

export const metadata: Metadata = {
  title: "Enrollments",
};

export default async function TrainingPage() {
  const user = await getCurrentUserActionCached();
  const trainings = await getEnrolledTrainingsActionCached(user);

  // If there are no trainings at all, show the default message
  if (!trainings || trainings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        You are not enrolled in any trainings.
      </div>
    );
  }

  return (
    <>
      <DesktopRedirector trainings={trainings} />

      {/* Mobile view: show list of trainings */}
      <div className="md:hidden">
        <EnrolledTrainingsList trainings={trainings} />
      </div>

      {/* Desktop view: show placeholder. The list is in layout.tsx */}
      <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
        Select a training to view details
      </div>
    </>
  );
}
