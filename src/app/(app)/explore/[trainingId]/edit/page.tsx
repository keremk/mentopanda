import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { EditTrainingForm } from "./edit-training";

export default async function EditTrainingPage({
  params,
}: {
  params: { trainingId: number };
}) {
  const training = await getTrainingByIdAction(params.trainingId);

  if (!training) {
    notFound();
  }

  return <EditTrainingForm training={training}/>;
}
