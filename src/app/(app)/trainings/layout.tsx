import { getTrainingWithProgressAction } from "../trainingActions"
import { SearchProvider } from "@/components/providers/search-provider"
import { SearchWrapper } from "@/components/search-wrapper"

export default async function TrainingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const trainings = await getTrainingWithProgressAction()

  return (
    <>
      <SearchWrapper
        items={trainings}
        searchKeys={["title", "description"]}
        placeholder="Search trainings..."
      />
      <SearchProvider initialTrainings={trainings}>
        {children}
      </SearchProvider>
    </>
  )
} 