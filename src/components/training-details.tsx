"use client";

import { TrainingWithProgress } from "@/data/trainings";
import { Button } from "@/components/ui/button";
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
import { useTheme } from "next-themes";

interface TrainingDetailsProps {
  training: TrainingWithProgress;
}

export function TrainingDetails({ training }: TrainingDetailsProps) {
  const hasModules = training.modules && training.modules.length > 0;

  const getRandomModuleId = () => {
    if (!hasModules) return null;
    return training.modules[Math.floor(Math.random() * training.modules.length)]
      .id;
  };

  const { resolvedTheme } = useTheme();
  const fallbackImage =
    resolvedTheme === "dark"
      ? "/placeholder-training-dark.svg"
      : "/placeholder-training.svg";

  const randomModuleId = getRandomModuleId();

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-start space-x-4">
        <div className="flex flex-col space-y-4">
          <Image
            src={training.imageUrl || fallbackImage}
            alt={`${training.title} cover`}
            width={200}
            height={200}
            className="rounded-lg"
            sizes="200px"
          />
          {hasModules ? (
            randomModuleId ? (
              <Link href={`/simulation/${randomModuleId}`}>
                <Button className="w-full" variant="brand">
                  Start Random Module
                </Button>
              </Link>
            ) : (
              <Button disabled className="w-full">
                All Modules Completed
              </Button>
            )
          ) : (
            <Button disabled className="w-full">
              No Modules Available
            </Button>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{training.title}</h1>
          <p className="my-4 text-muted-foreground">{training.description}</p>
        </div>
      </div>
      <div>
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
          {hasModules ? (
            training.modules.map((module) => (
              <div key={module.id} className="border rounded-lg p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">{module.title}</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        Practices: {module.practiceCount}
                      </span>
                      <Link href={`/simulation/${module.id}`}>
                        <Button variant="ghost-brand">Start Module</Button>
                      </Link>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    <AccordionItem value="instructions">
                      <AccordionTrigger>Instructions</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          {module.instructions || "No instructions available."}
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="character">
                      <AccordionTrigger>Character</AccordionTrigger>
                      <AccordionContent>
                        {module.characters?.[0] ? (
                          <div className="flex items-start space-x-4">
                            <Image
                              src={
                                module.characters[0].avatarUrl ||
                                "/placeholder-avatar.svg"
                              }
                              alt={module.characters[0].name}
                              width={100}
                              height={100}
                              className="rounded-full"
                              sizes="100px"
                            />
                            <div>
                              <h5 className="font-semibold">
                                {module.characters[0].name}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {module.characters[0].description ||
                                  "No description available."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No character assigned.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {module.history.length > 0 && (
                      <AccordionItem value="history">
                        <AccordionTrigger>Practice History</AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Practice #</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...module.history]
                                .sort((a, b) => {
                                  if (!a.completedAt || !b.completedAt)
                                    return 0;
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
                                    <TableCell className="text-right">
                                      <Link
                                        href={`/assessments/${practice.id}`}
                                      >
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
                    )}
                  </Accordion>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">
                This training does not have any modules yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
