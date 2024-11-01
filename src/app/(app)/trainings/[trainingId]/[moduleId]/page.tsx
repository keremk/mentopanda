import { getTrainingWithProgressAction } from "@/app/(app)/trainingActions";
import { SimulationContainer } from "@/components/simulation-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

type Props = {
  params: {
    trainingId: string;
    moduleId: string;
  };
};

export default async function Page({ params: { trainingId, moduleId } }: Props) {
  const trainings = await getTrainingWithProgressAction(trainingId);
  const training = trainings[0];
  
  if (!training) redirect("/trainings");
  
  const currentModule = training.modules.find(m => m.id === Number(moduleId));
  if (!currentModule) redirect(`/trainings/${trainingId}`);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{training.title}</CardTitle>
          <CardDescription>{training.tagline}</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">{currentModule.title}</h2>
          {currentModule.instructions && (
            <p className="mb-4">{currentModule.instructions}</p>
          )}
          
          <SimulationContainer 
            trainingId={trainingId}
            module={currentModule}
          />
        </CardContent>
      </Card>
    </div>
  );
}
