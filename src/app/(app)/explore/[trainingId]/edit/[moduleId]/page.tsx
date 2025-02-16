import { notFound } from "next/navigation";
import ModuleEditForm from "./edit-module";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";

export default async function EditModulePage(props: {
  params: Promise<{ moduleId: number }>;
}) {
  const params = await props.params;
  const trainingModule = await getModuleByIdAction2(params.moduleId);
  if (!trainingModule) notFound();

  return <ModuleEditForm module={trainingModule} />;
}
