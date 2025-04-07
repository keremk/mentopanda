import { notFound } from "next/navigation";
import { getTrainingByIdForEditAction } from "@/app/actions/trainingActions";
import { EditContainer } from "./edit-container";
import { getCharactersActionCached } from "@/app/actions/character-actions";
import { TrainingEditProvider } from "@/contexts/training-edit-provider";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export default async function EditTrainingPage(props: {
  params: Promise<{ trainingId: number }>;
}) {
  const params = await props.params;
  const user = await getCurrentUserAction();
  const [training, characters] = await Promise.all([
    getTrainingByIdForEditAction(params.trainingId),
    getCharactersActionCached(user.currentProject.id),
  ]);

  if (!training) {
    notFound();
  }

  return (
    <TrainingEditProvider
      initialTraining={training}
      initialCharacters={characters}
    >
      <EditContainer user={user} />
    </TrainingEditProvider>
  );
}
