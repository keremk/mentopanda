import { notFound } from "next/navigation";
import { getTrainingByIdForEditAction } from "@/app/actions/trainingActions";
import { EditContainer } from "./edit-container";
import { getCharactersActionCached } from "@/app/actions/character-actions";
// Remove the old multi-context provider
// import { TrainingEditProvider } from "@/contexts/training-edit-provider";
// Import the new centralized provider
// import { TrainingEditProvider } from "@/contexts/training-edit-context";
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

  // Pass data as props to the client component
  return (
    <EditContainer
      user={user}
      initialTraining={training}
      initialCharacters={characters}
    />
  );
}
