import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
  return (
    <div className="container mx-auto px-4">
      <Button asChild className="mb-4">
        <Link href="/explore">Back to Courses</Link>
      </Button>
      <h1 className="text-3xl font-bold mb-4">Course Details</h1>
      <p>Course ID: {params.courseId}</p>
      <p>This is a placeholder for the course details page.</p>
    </div>
  )
}