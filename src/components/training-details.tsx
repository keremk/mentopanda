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
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { UnenrollButton } from "./unenroll-button";

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
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col space-y-6 md:flex-row md:items-start md:space-x-6 md:space-y-0">
        {/* Image and buttons section */}
        <div className="flex flex-col space-y-4 md:flex-shrink-0">
          <div className="w-full max-w-xs mx-auto md:mx-0 md:w-40">
            <Image
              src={training.imageUrl || fallbackImage}
              alt={`${training.title} cover`}
              width={200}
              height={200}
              className="w-full h-auto rounded-lg"
              sizes="(max-width: 768px) 288px, 160px"
            />
          </div>
          <div className="flex flex-col space-y-2 w-full max-w-xs mx-auto md:mx-0 md:w-40">
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
            <UnenrollButton
              label=" Leave"
              trainingId={training.id}
              trainingTitle={training.title}
              disabled={!training}
              className="h-14"
            />
          </div>
        </div>

        {/* Title and description section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{training.title}</h1>
          <div className="my-4 text-muted-foreground">
            <MemoizedMarkdown content={training.description || ""} />
          </div>
        </div>
      </div>
      <div>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Modules</h3>
          {hasModules ? (
            training.modules.map((module) => (
              <div key={module.id} className="border rounded-lg p-4">
                <div className="flex flex-col space-y-4">
                  {/* Module title on top */}
                  <div>
                    <h4 className="text-lg font-semibold">{module.title}</h4>
                  </div>

                  {/* Practices count and start button directly under title */}
                  <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                    <span className="text-sm text-muted-foreground">
                      Practices: {module.practiceCount}
                    </span>
                    <Link href={`/simulation/${module.id}`}>
                      <Button
                        variant="ghost-brand"
                        className="w-full sm:w-auto"
                      >
                        Start Module
                      </Button>
                    </Link>
                  </div>

                  {/* Practice history accordion */}
                  <Accordion type="multiple" className="space-y-2">
                    {module.history.length > 0 && (
                      <AccordionItem value="history" className="border-b-0">
                        <AccordionTrigger>Practice History</AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-center">#</TableHead>
                                <TableHead className="text-center">
                                  Date
                                </TableHead>
                                <TableHead className="text-center">
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
                                          View
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
