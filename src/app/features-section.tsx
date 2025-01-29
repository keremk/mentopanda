"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { BarChart3, Brain, LineChart, FileText } from "lucide-react"
import { ProgressBar } from "./progress-bar"

const AUTOPLAY_DELAY = 5000 // 5 seconds per feature
const PROGRESS_INTERVAL = 50 // Update progress every 50ms

interface Feature {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  image: string
}

const features: Feature[] = [
  {
    id: 1,
    title: "Pre-built Lessons",
    description: "Lots of pre-built lessons to get you started.",
    icon: <BarChart3 className="w-6 h-6 text-red-500" />,
    image: "/catalog.png",
  },
  {
    id: 2,
    title: "Build your unique characters",
    description: "Create your own characters and use them in your lessons.",
    icon: <Brain className="w-6 h-6 text-red-500" />,
    image: "/characters.png",
  },
  {
    id: 3,
    title: "Customize your lessons",
    description: "Add your own lessons and use them.",
    icon: <LineChart className="w-6 h-6 text-red-500" />,
    image: "/customise.png",
  },
  {
    id: 4,
    title: "Manage your enrollments",
    description: "Enroll yourself or your students and track their progress.",
    icon: <FileText className="w-6 h-6 text-red-500" />,
    image: "/enrollments.png",
  },
  {
    id: 5,
    title: "Simulate conversations",
    description: "Use SOTA AI models to simulate conversations and get feedback.",
    icon: <FileText className="w-6 h-6 text-red-500" />,
    image: "/simulation.png",
  },
]

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToNextFeature = useCallback(() => {
    setIsTransitioning(true)
    setProgress(0)
    setTimeout(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
      setIsTransitioning(false)
    }, 100) // Short delay to ensure progress resets visually
  }, [])

  useEffect(() => {
    if (isTransitioning) return

    let progressInterval: NodeJS.Timeout

    const startProgress = () => {
      let currentProgress = 0

      progressInterval = setInterval(() => {
        currentProgress += (PROGRESS_INTERVAL / AUTOPLAY_DELAY) * 100
        if (currentProgress >= 100) {
          clearInterval(progressInterval)
          goToNextFeature()
          return
        }
        setProgress(currentProgress)
      }, PROGRESS_INTERVAL)
    }

    startProgress()

    return () => {
      clearInterval(progressInterval)
    }
  }, [isTransitioning, goToNextFeature]) // Removed activeFeature from dependencies

  const handleFeatureHover = (index: number) => {
    if (index !== activeFeature) {
      setActiveFeature(index)
      setProgress(0)
    }
  }

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-red-500 font-medium mb-4">FEATURES</div>
          <h2 className="text-4xl font-bold mb-16">User Flows and Navigational Structures</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={feature.id} className="text-center" onMouseEnter={() => handleFeatureHover(index)}>
                <div className="relative">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <ProgressBar
                    progress={index === activeFeature && !isTransitioning ? progress : 0}
                    isActive={index === activeFeature}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto rounded-lg overflow-hidden border shadow-lg">
            {features.map((feature, index) => (
              <Image
                key={feature.id}
                src={feature.image || "/placeholder.svg"}
                alt={feature.title}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  index === activeFeature ? "opacity-100" : "opacity-0"
                }`}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

