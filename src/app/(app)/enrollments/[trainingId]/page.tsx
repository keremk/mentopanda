import { TrainingDetails } from "@/components/training-details";
import { notFound } from "next/navigation";
import { getTrainingWithProgressAction } from "@/app/actions/trainingActions";

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
    <div className="h-full overflow-y-auto p-6">
      <TrainingDetails training={training} />
    </div>
  );
}
