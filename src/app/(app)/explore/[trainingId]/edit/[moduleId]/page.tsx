import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import { getModulesByTrainingId } from "@/data/trainings";
import ModuleEditForm from "./edit-module";

export default async function EditModulePage({
  params,
}: {
  params: { trainingId: string; moduleId: string };
}) {
  const training = await getTrainingByIdAction(params.trainingId);
  if (!training) notFound();

  const supabase = createClient();
  const modules = await getModulesByTrainingId(supabase, params.trainingId);
  const module = modules.find(m => m.id === parseInt(params.moduleId));
  if (!module) notFound();

  return <ModuleEditForm training={training} module={module} />;
}
