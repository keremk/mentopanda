import { notFound } from "next/navigation";
import ModuleEditForm from "./edit-module";
import { getModuleByIdAction2 } from "@/app/(app)/moduleActions";

export default async function EditModulePage({
  params,
}: {
  params: { moduleId: number };
}) {
  const module = await getModuleByIdAction2(params.moduleId);
  if (!module) notFound();

  return <ModuleEditForm module={module} />;
}
