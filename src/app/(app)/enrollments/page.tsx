import { Metadata } from "next";
import { getSharedData } from "./layout";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Enrollments",
};

export default async function TrainingPage() {
  const trainings = await getSharedData();

  if (trainings.length > 0) {
    redirect(`/enrollments/${trainings[0].id}`);
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a training to view details
    </div>
  );
}
