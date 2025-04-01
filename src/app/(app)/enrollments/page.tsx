import { Metadata } from "next";
import { getEnrolledTrainingsActionCached } from "@/app/actions/enrollment-actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Enrollments",
};

export default async function TrainingPage() {
  const trainings = await getEnrolledTrainingsActionCached();

  // If there are no trainings at all, show the default message
  if (!trainings || trainings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a training to view details
      </div>
    );
  }

  // Redirect to the first training
  redirect(`/enrollments/${trainings[0].id}`);
}
