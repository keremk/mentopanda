"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Info, BookOpen } from "lucide-react";
import { useState } from "react";

interface CourseCardProps {
  title: string;
  imageUrl?: string;
  onAddCourse: () => void;
  onShowDetails: () => void;
}

export function CourseCard({
  title,
  imageUrl,
  onAddCourse,
  onShowDetails,
}: CourseCardProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "/placeholder.svg?height=200&width=300";

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="p-0 relative aspect-video">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={`Cover image for ${title}`}
            layout="fill"
            objectFit="cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl font-bold line-clamp-2">
          {title}
        </CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" onClick={onAddCourse} className="flex-1 mr-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add to List
        </Button>
        <Button
          variant="secondary"
          onClick={onShowDetails}
          className="flex-1 ml-2"
        >
          <Info className="mr-2 h-4 w-4" />
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
