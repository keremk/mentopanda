import { getTrainingWithProgressAction } from "../trainingActions"
import { SearchProvider } from "@/components/providers/search-provider"
import { HeaderSearchArea } from "@/components/header-search-area"

export default async function TrainingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const trainings = await getTrainingWithProgressAction()

  return (
    <>
      <HeaderSearchArea trainings={trainings} />
      <SearchProvider initialTrainings={trainings}>
        {children}
      </SearchProvider>
    </>
  )
} 