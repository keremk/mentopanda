"use client"

import { TrainingWithProgress } from "@/data/trainings"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface TrainingDetailsCardProps {
  training: TrainingWithProgress
}

export function TrainingDetailsCard({ training }: TrainingDetailsCardProps) {
  const startRandomModule = () => {
    const incompleteModules = training.modules.filter((m) => !m.completed)
    if (incompleteModules.length > 0) {
      const randomModule =
        incompleteModules[Math.floor(Math.random() * incompleteModules.length)]
      alert(`Starting module: ${randomModule.title}`)
    } else {
      alert("All modules completed!")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start space-x-4">
        <div className="flex flex-col space-y-4">
          <Image
            src={training.imageUrl || "/placeholder.svg"}
            alt={`${training.title} cover`}
            width={200}
            height={200}
            className="rounded-lg"
          />
          <Button onClick={startRandomModule}>
            Start Random Module
          </Button>
        </div>
        <div>
          <CardTitle>{training.title}</CardTitle>
          <CardDescription className="my-4">{training.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {training.previewUrl && (
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="video">
              <AccordionTrigger>Video Introduction</AccordionTrigger>
              <AccordionContent>
                <video controls className="w-full">
                  <source src={training.previewUrl} type="video/mp4" />
                  Your browser does not support the video element.
                </video>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
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
                      <Link
                        href={`/assessment/${training.id}/${module.id}`}
                        passHref
                      >
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
    </Card>
  )
}
