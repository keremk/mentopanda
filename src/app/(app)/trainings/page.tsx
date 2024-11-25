import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list"

export default async function TrainingPage() {

  return (
    <div className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-36">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">My Trainings</h1>
      </div>
      <EnrolledTrainingsList />
    </div>
  )
}
