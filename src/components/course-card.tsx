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
  tagline?: string;
  imageUrl?: string;
  onAddCourse: () => void;
  onShowDetails: () => void;
}

export function CourseCard({
  title,
  tagline,
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
    <Card className="w-full min-w-[300px] max-w-[400px] h-[350px] flex flex-col">
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
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold line-clamp-2 mb-2">
          {title}
        </CardTitle>
        {tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2">{tagline}</p>
        )}
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
