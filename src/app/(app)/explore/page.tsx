
import { getTrainings } from "@/data/trainings"
import { CourseGrid } from "@/components/course-grid"

export default async function ExplorePage() {
  const trainings = await getTrainings()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Explore Trainings</h1>
      <CourseGrid trainings={trainings} />
    </div>
  )
}
