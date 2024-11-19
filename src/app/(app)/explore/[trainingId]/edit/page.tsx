import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { getModulesByTrainingIdAction } from "@/app/(app)/moduleActions";
import { EditTrainingForm } from "./edit-training";

export default async function EditTrainingPage({
  params,
}: {
  params: { trainingId: string };
}) {
  const training = await getTrainingByIdAction(params.trainingId);

  if (!training) {
    notFound();
  }

  const modules = await getModulesByTrainingIdAction(params.trainingId);

  return <EditTrainingForm training={training} modules={modules} />;
}
