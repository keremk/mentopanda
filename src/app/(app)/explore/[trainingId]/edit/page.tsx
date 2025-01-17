import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { EditTrainingForm } from "./edit-training";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export default async function EditTrainingPage({
  params,
}: {
  params: { trainingId: number };
}) {
  const [training, user] = await Promise.all([
    getTrainingByIdAction(params.trainingId),
    getCurrentUserAction(),
  ]);

  if (!training) {
    notFound();
  }

  return <EditTrainingForm training={training} user={user} />;
}
