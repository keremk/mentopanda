import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Search, GripVertical } from "lucide-react";
import Link from "next/link";
import { Enrollment } from "@/data/enrollments";
import { getEnrolledTrainingsAction } from "@/app/(app)/explore/enrollActions";

export async function EnrolledTrainings() {
  let trainings: Enrollment[] = [];
  let error = null;

  try {
    trainings = await getEnrolledTrainingsAction();
  } catch (e) {
    error = e;
    console.error("Failed to fetch enrolled trainings:", e);
  }

  if (error) {
    return <div>Error loading enrolled trainings. Please try again later.</div>;
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Enrolled Trainings</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {trainings && trainings.length > 0 ? (
          <ul className="space-y-4">
            {trainings.map((training) => (
              <li
                key={training.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              >
                <span className="text-lg font-medium">{training.trainingTitle}</span>
                <div>
                  <Button size="sm" className="mr-2" asChild>
                    <Link href={`/training/${training.trainingId}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Training
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No trainings enrolled yet
            </p>
            <Link href="/explore">
              <Button size="lg">
                <Search className="mr-2 h-5 w-5" />
                Explore Trainings
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
