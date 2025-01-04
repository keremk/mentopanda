"use client";

import { TrainingWithProgress } from "@/data/trainings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface TrainingDetailsCardProps {
  training: TrainingWithProgress;
}

export function TrainingDetailsCard({ training }: TrainingDetailsCardProps) {
  const getRandomModuleId = () => {
    return training.modules[Math.floor(Math.random() * training.modules.length)]
      .id;
  };

  const randomModuleId = getRandomModuleId();
  const provider = "livekit";

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
          {randomModuleId ? (
            <Link href={`/simulation/${provider}/${randomModuleId}`}>
              <Button className="w-full">Start Random Module</Button>
            </Link>
          ) : (
            <Button disabled className="w-full">
              All Modules Completed
            </Button>
          )}
        </div>
        <div>
          <CardTitle>{training.title}</CardTitle>
          <CardDescription className="my-4">
            {training.description}
          </CardDescription>
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

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Modules</h3>
          {training.modules.map((module) => (
            <div key={module.id} className="border rounded-lg p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">{module.title}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Practices: {module.practiceCount}
                    </span>
                    {module.lastScore !== null && (
                      <span className="text-sm text-muted-foreground">
                        Last Score: {module.lastScore}
                      </span>
                    )}
                    <Link href={`/simulation/${provider}/${module.id}`}>
                      <Button>Start Module</Button>
                    </Link>
                  </div>
                </div>

                {module.history.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="history">
                      <AccordionTrigger>Practice History</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Practice #</TableHead>
                              <TableHead>Completed</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...module.history]
                              .sort((a, b) => {
                                if (!a.completedAt || !b.completedAt) return 0;
                                return (
                                  new Date(b.completedAt).getTime() -
                                  new Date(a.completedAt).getTime()
                                );
                              })
                              .map((practice) => (
                                <TableRow key={practice.id}>
                                  <TableCell>
                                    #{practice.practiceNumber}
                                  </TableCell>
                                  <TableCell>
                                    {practice.completedAt &&
                                      format(
                                        new Date(practice.completedAt),
                                        "MMM d, yyyy HH:mm"
                                      )}
                                  </TableCell>
                                  <TableCell>
                                    {practice.assessmentScore}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/assessments/${practice.id}`}>
                                      <Button variant="outline" size="sm">
                                        View Assessment
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
