import { notFound } from "next/navigation";
import { getTrainingByIdForEditAction } from "@/app/actions/trainingActions";
import { EditContainer } from "./edit-container";
import { getCharactersAction } from "@/app/actions/character-actions";
import { TrainingEditProvider } from "@/contexts/training-edit-provider";

export default async function EditTrainingPage(props: {
  params: Promise<{ trainingId: number }>;
}) {
  const params = await props.params;
  const [training, characters] = await Promise.all([
    getTrainingByIdForEditAction(params.trainingId),
    getCharactersAction(),
  ]);

  if (!training) {
    notFound();
  }

  return (
    <TrainingEditProvider
      initialTraining={training}
      initialCharacters={characters}
    >
      <EditContainer />
    </TrainingEditProvider>
  );
}
