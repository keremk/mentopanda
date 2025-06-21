"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Search, PlayIcon } from "lucide-react";
import { EnrollmentButton } from "@/components/enrollment-button";
import { TrainingSummary } from "@/data/trainings";
import { ThemedImage } from "@/components/themed-image";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type EnrolledTrainingsCardProps = {
  trainings: TrainingSummary[];
};

export function EnrolledTrainingsCard({
  trainings: initialTrainings,
}: EnrolledTrainingsCardProps) {
  const [displayedTrainings, setDisplayedTrainings] =
    useState<TrainingSummary[]>(initialTrainings);

  useEffect(() => {
    setDisplayedTrainings(initialTrainings);
  }, [initialTrainings]);

  const handleUnenroll = (trainingId: number) => {
    setDisplayedTrainings((prevTrainings) =>
      prevTrainings.filter((t) => t.id !== trainingId)
    );
  };

  return (
    <Card className="w-full h-[310px] flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Enrolled Trainings</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 mx-3">
        {displayedTrainings && displayedTrainings.length > 0 ? (
          <Table>
            <TableBody>
              {displayedTrainings.map((training) => (
                <TableRow key={training.id} className="border-0">
                  <TableCell className="w-16 p-2">
                    <div className="relative h-12 w-12">
                      <ThemedImage
                        lightSrc={
                          training.imageUrl || "/placeholder-training.svg"
                        }
                        darkSrc={
                          training.imageUrl || "/placeholder-training-dark.svg"
                        }
                        alt={training.title}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold p-2 whitespace-pre-line break-words">
                    {training.title}
                  </TableCell>
                  <TableCell className="text-right p-2">
                    <Button variant="ghost-brand" asChild>
                      <Link href={`/enrollments/${training.id}`}>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Train
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right p-2">
                    <EnrollmentButton
                      key={`enrollment-${training.id}`}
                      trainingId={training.id}
                      isEnrolled={true}
                      onUnenroll={handleUnenroll}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 px-6">
            <p className="text-muted-foreground mb-4">
              No trainings enrolled yet
            </p>
            <Link href="/explore">
              <Button size="lg">
                <Search className="mr-2 h-5 w-4" />
                Explore Trainings
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
