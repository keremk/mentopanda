import { TrainingDetailsCard } from "@/components/training-details-card"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { getTrainingWithProgressAction } from "@/app/(app)/trainingActions"

type TrainingPageProps = {
  params: Promise<{
    trainingId: number
  }>
}

export default async function TrainingPage(props: TrainingPageProps) {
  const params = await props.params;
  const training = await getTrainingWithProgressAction(params.trainingId)

  if (!training) notFound()

  return (
    <div className="container max-w-4xl py-6">
      <Suspense fallback={<CardSkeleton />}>
        <TrainingDetailsCard training={training} />
      </Suspense>
    </div>
  )
}
