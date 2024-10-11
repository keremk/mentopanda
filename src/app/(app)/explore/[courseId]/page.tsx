import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { mockCourses } from '@/lib/mock-data'

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = url.split('v=')[1]
  const embedUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className="aspect-video">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
      ></iframe>
    </div>
  )
}

export default function TrainingDetailsPage({ params }: { params: { courseId: string } }) {
  const course = mockCourses.find(c => c.id === params.courseId)

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button asChild variant="outline">
          <Link href="/explore" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>
            Back to Courses
          </Link>
        </Button>
        <Button>Enroll Now</Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-xl text-gray-600 mb-4">{course.tagline}</p>
        <div className="aspect-video relative mb-4">
          <Image
            src={course.imageUrl}
            alt={course.title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Course Description</h2>
        <p className="text-gray-700">{course.description}</p>
      </div>

      {course.previewURL && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Course Preview</h2>
          <YouTubeEmbed url={course.previewURL} />
        </div>
      )}

      <div className="text-center">
        <Button size="lg">Enroll Now</Button>
      </div>
    </div>
  )
}