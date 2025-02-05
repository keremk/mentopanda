import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Search, PlayCircle, GripVertical } from "lucide-react";
import { EnrollmentButton } from "@/components/enrollment-button";
import { getEnrolledTrainingsAction } from "@/app/(app)/trainingActions";

export async function EnrolledTrainingsCard() {
  const trainings = await getEnrolledTrainingsAction();

  return (
    <Card className="w-full h-[310px] flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Enrolled Trainings</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-73px)] overflow-y-auto">
        <div className="space-y-4">
          {trainings && trainings.length > 0 ? (
            trainings.map((training) => (
              <Card key={training.id} className="p-4">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="flex min-w-0 items-center">
                    <div className="relative h-12 w-12 mr-4 flex-shrink-0">
                      <Image
                        src={training.imageUrl || "/placeholder.png"}
                        alt={training.title}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 48px) 100vw, 48px"
                      />
                    </div>
                    <div className="min-w-0 max-w-[180px]">
                      <h3 className="font-semibold break-words whitespace-pre-line truncate">
                        {training.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    <Button
                      variant="secondary"
                      className="flex-shrink-0"
                      asChild
                    >
                      <Link href={`/enrollments/${training.id}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Train
                      </Link>
                    </Button>
                    <EnrollmentButton
                      key={`enrollment-${training.id}`}
                      trainingId={training.id}
                      isEnrolled={true}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
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
        </div>
      </CardContent>
    </Card>
  );
}
