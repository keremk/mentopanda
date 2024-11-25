import { TrainingDetailsCard } from "@/components/training-details-card"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { getTrainingByIdAction } from "@/app/(app)/trainingActions"

type TrainingPageProps = {
  params: {
    trainingId: number
  }
}

export default async function TrainingPage({ params }: TrainingPageProps) {
  const training = await getTrainingByIdAction(params.trainingId)
  
  if (!training) notFound()

  return (
    <div className="container max-w-4xl py-6">
      <Suspense fallback={<CardSkeleton />}>
        <TrainingDetailsCard training={training} />
      </Suspense>
    </div>
  )
}
