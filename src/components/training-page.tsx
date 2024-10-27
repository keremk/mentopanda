'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Fuse from 'fuse.js'

// Mock data
const trainings = [
  {
    id: 1,
    title: "Introduction to React",
    description: "Learn the basics of React and component-based architecture.",
    imageSrc: "/placeholder.svg?height=100&width=100",
    videoSrc: "https://example.com/react-intro.mp4",
    modules: [
      { id: 1, title: "React Fundamentals", completed: true, attempts: 2, lastScore: 85 },
      { id: 2, title: "State and Props", completed: false, attempts: 1, lastScore: 70 },
      { id: 3, title: "Hooks", completed: false, attempts: 0, lastScore: null },
    ],
  },
  {
    id: 2,
    title: "Advanced JavaScript Concepts",
    description: "Dive deep into advanced JavaScript topics and patterns.",
    imageSrc: "/placeholder.svg?height=100&width=100",
    videoSrc: "https://example.com/advanced-js.mp4",
    modules: [
      { id: 4, title: "Closures", completed: true, attempts: 1, lastScore: 90 },
      { id: 5, title: "Prototypes", completed: false, attempts: 0, lastScore: null },
      { id: 6, title: "Async Programming", completed: false, attempts: 0, lastScore: null },
    ],
  },
]

export function TrainingPageComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTrainings, setFilteredTrainings] = useState(trainings)

  const fuse = new Fuse(trainings, {
    keys: ['title', 'description'],
    threshold: 0.3,
  })

  useEffect(() => {
    if (searchQuery) {
      const results = fuse.search(searchQuery)
      setFilteredTrainings(results.map(result => result.item))
    } else {
      setFilteredTrainings(trainings)
    }
  }, [searchQuery])

  const startRandomModule = (trainingId) => {
    const training = trainings.find(t => t.id === trainingId)
    const incompleteModules = training.modules.filter(m => !m.completed)
    if (incompleteModules.length > 0) {
      const randomModule = incompleteModules[Math.floor(Math.random() * incompleteModules.length)]
      alert(`Starting module: ${randomModule.title}`)
    } else {
      alert("All modules completed!")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Training Platform</h1>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search trainings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>
      {filteredTrainings.map((training) => (
        <Card key={training.id} className="mb-6">
          <CardHeader className="flex flex-row items-start space-x-4">
            <Image
              src={training.imageSrc}
              alt={`${training.title} cover`}
              width={100}
              height={100}
              className="rounded-lg"
            />
            <div>
              <CardTitle>{training.title}</CardTitle>
              <CardDescription>{training.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="video">
                <AccordionTrigger>Video</AccordionTrigger>
                <AccordionContent>
                  <video controls className="w-full">
                    <source src={training.videoSrc} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Accordion type="single" collapsible>
              <AccordionItem value="modules">
                <AccordionTrigger>Modules</AccordionTrigger>
                <AccordionContent>
                  {training.modules.map((module) => (
                    <div key={module.id} className="mb-4 p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold">{module.title}</h4>
                        <Badge variant={module.completed ? "success" : "secondary"}>
                          {module.completed ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <Progress value={module.completed ? 100 : (module.attempts > 0 ? 50 : 0)} className="mb-2" />
                      <div className="flex justify-between items-center">
                        <span>Attempts: {module.attempts}</span>
                        {module.lastScore !== null && (
                          <span>Last Score: {module.lastScore}%</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <Button onClick={() => alert(`Starting module: ${module.title}`)}>
                          Start Module
                        </Button>
                        {module.lastScore !== null && (
                          <Link href={`/assessment/${training.id}/${module.id}`} passHref>
                            <Button variant="outline" className="ml-2">
                              View Assessment
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter>
            <Button onClick={() => startRandomModule(training.id)}>Start Random Module</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}