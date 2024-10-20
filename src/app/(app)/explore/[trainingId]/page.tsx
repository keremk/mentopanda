import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { getTrainingById } from '@/data/trainings'
import { notFound } from 'next/navigation'
import { EnrollmentButton } from '@/components/enrollment-button'

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

export default async function TrainingDetailsPage({ params }: { params: { trainingId: string } }) {
  const training = await getTrainingById(params.trainingId)

  if (!training) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button asChild variant="outline">
          <Link href="/explore" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>
            Back to Trainings
          </Link>
        </Button>
        <EnrollmentButton trainingId={training.id} />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{training.title}</h1>
        <p className="text-xl text-gray-600 mb-4">{training.tagline}</p>
        <div className="aspect-video relative mb-4">
          <Image
            src={training.image_url}
            alt={training.title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Training Description</h2>
        <p className="text-gray-700">{training.description}</p>
      </div>

      {training.preview_url && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Training Preview</h2>
          <YouTubeEmbed url={training.preview_url} />
        </div>
      )}

      <div className="text-center">
        <EnrollmentButton trainingId={training.id} />
      </div>
    </div>
  )
}
