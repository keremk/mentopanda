import { notFound } from "next/navigation";
import ModuleEditForm from "./edit-module";
import { getModuleByIdAction2 } from "@/app/(app)/moduleActions";

export default async function EditModulePage(
  props: {
    params: Promise<{ moduleId: number }>;
  }
) {
  const params = await props.params;
  const module = await getModuleByIdAction2(params.moduleId);
  if (!module) notFound();

  return <ModuleEditForm module={module} />;
}
