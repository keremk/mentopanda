import { 
  getTrainingsWithEnrollmentAction,
  getPublicTrainingsAction 
} from "@/app/actions/trainingActions";
import { TrainingCard } from "@/components/training-card";
import { Metadata } from "next";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { CreateTrainingButton } from "@/components/create-training-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Trainings Catalog",
};

export default async function ExplorePage() {
  const user = await getCurrentUserActionCached();
  const hasTrainingManagePermission = user.permissions.includes("training.manage");
  
  const [trainings, publicTrainings] = await Promise.all([
    getTrainingsWithEnrollmentAction(),
    hasTrainingManagePermission ? getPublicTrainingsAction() : Promise.resolve([]),
  ]);

  return (
    <div className="py-2">
      {hasTrainingManagePermission && (
        <div className="absolute top-0 right-0 p-4 z-10 hidden md:block">
          <CreateTrainingButton needsOrganization={false} />
        </div>
      )}

{hasTrainingManagePermission ? (
        <Tabs defaultValue="my-trainings" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-auto grid-cols-2 bg-secondary/30 p-1 rounded-lg border border-border/30">
              <TabsTrigger
                value="my-trainings"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-brand data-[state=active]:font-bold"
              >
                My Trainings
              </TabsTrigger>
              <TabsTrigger
                value="public-trainings"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-brand data-[state=active]:font-bold"
              >
                Public Trainings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-trainings">
            <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t py-6">
              {trainings.map((training, index) => (
                <TrainingCard
                  key={training.id}
                  id={training.id}
                  title={training.title}
                  tagline={training.tagline}
                  imageUrl={training.imageUrl}
                  isEnrolled={training.isEnrolled}
                  priority={index < 6}
                  isEnrollable={true}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="public-trainings">
            <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t py-6">
              {publicTrainings.map((training, index) => (
                <TrainingCard
                  key={training.id}
                  id={training.id}
                  title={training.title}
                  tagline={training.tagline}
                  imageUrl={training.imageUrl}
                  isEnrolled={false}
                  priority={index < 6}
                  isPublic={true}
                  isEnrollable={false}
                  isForked={training.isForked}
                  creatorInfo={training.creatorInfo}
                  forkCount={training.forkCount}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t py-6">
          {trainings.map((training, index) => (
            <TrainingCard
              key={training.id}
              id={training.id}
              title={training.title}
              tagline={training.tagline}
              imageUrl={training.imageUrl}
              isEnrolled={training.isEnrolled}
              priority={index < 6}
              isEnrollable={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
