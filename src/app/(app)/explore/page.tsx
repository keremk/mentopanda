import { Suspense } from 'react'
import { CourseGrid } from '@/components/course-grid'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function ExplorePage() {
  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Explore Training Courses</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Course
        </Button>
      </header>
      <Suspense fallback={<div>Loading courses...</div>}>
        <CourseGrid />
      </Suspense>
    </div>
  )
}