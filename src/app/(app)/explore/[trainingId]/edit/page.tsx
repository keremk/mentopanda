import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { getModulesByTrainingId } from "@/data/trainings";
import { createClient } from "@/utils/supabase/server";
import EditTrainingForm from "@/components/edit-training";

export default async function EditTrainingPage({
  params,
}: {
  params: { trainingId: string };
}) {
  const training = await getTrainingByIdAction(params.trainingId);

  if (!training) {
    notFound();
  }

  const supabase = createClient();
  const modules = await getModulesByTrainingId(supabase, params.trainingId);

  return <EditTrainingForm training={training} modules={modules} />;
}
