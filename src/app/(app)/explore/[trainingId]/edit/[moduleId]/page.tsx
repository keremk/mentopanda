import { notFound } from "next/navigation";
import { getTrainingByIdAction } from "@/app/(app)/trainingActions";
import ModuleEditForm from "./edit-module";
import { getModuleByIdAction } from "@/app/(app)/moduleActions";

export default async function EditModulePage({
  params,
}: {
  params: { trainingId: string; moduleId: string };
}) {
  const module = await getModuleByIdAction(params.moduleId);
  if (!module) notFound();

  return <ModuleEditForm module={module} />;
}
