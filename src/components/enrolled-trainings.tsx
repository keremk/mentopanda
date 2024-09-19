"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Search, GripVertical } from "lucide-react";
import Link from "next/link";

type Training = {
  id: string;
  title: string;
};

type EnrolledTrainingsProps = {
  trainings: Training[];
};

export function EnrolledTrainings({ trainings = [] }: EnrolledTrainingsProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Enrolled Trainings</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {trainings.length > 0 ? (
          <ul className="space-y-4">
            {trainings.map((training) => (
              <li
                key={training.id}
                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              >
                <span className="text-lg font-medium">{training.title}</span>
                <Button size="sm">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Training
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No trainings enrolled yet
            </p>
            <Link href="/explore-trainings">
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
