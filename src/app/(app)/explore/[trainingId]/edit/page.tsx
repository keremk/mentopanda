import { notFound } from "next/navigation";
import { getTrainingByIdForEditAction } from "@/app/actions/trainingActions";
import { EditContainer } from "./edit-container";
import { getCharactersAction } from "@/app/actions/character-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export const dynamic = "force-dynamic";

export default async function EditTrainingPage(props: {
  params: Promise<{ trainingId: number }>;
}) {
  const params = await props.params;
  const user = await getCurrentUserAction();
  const [training, characters] = await Promise.all([
    getTrainingByIdForEditAction(params.trainingId),
    getCharactersAction(user.currentProject.id),
  ]);

  if (!training) {
    notFound();
  }

  // Pass data as props to the client component
  return (
    <EditContainer initialTraining={training} initialCharacters={characters} />
  );
}
