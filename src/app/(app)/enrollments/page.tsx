import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enrollments",
};

export default async function TrainingPage() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a training to view details
    </div>
  );
}
