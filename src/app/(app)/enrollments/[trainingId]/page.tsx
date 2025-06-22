import { TrainingDetails } from "@/components/training-details";
import { notFound } from "next/navigation";
import { getTrainingWithProgressAction } from "@/app/actions/trainingActions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enrollments",
};

type TrainingPageProps = {
  params: Promise<{
    trainingId: number;
  }>;
};

export default async function TrainingPage(props: TrainingPageProps) {
  const params = await props.params;
  const training = await getTrainingWithProgressAction(params.trainingId);

  if (!training) notFound();

  return (
    <div className="container mx-auto px-4 py-2 h-full">
      <div className="absolute top-2 right-4 z-10 md:hidden py-2">
        <Button asChild variant="ghost-brand">
          <Link href="/enrollments" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <div className="h-full overflow-y-auto p-6">
        <TrainingDetails training={training} />
      </div>
    </div>
  );
}
