"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnrollmentButton } from "@/components/enrollment-button";

interface TrainingCardProps {
  id: number;
  title: string;
  tagline?: string;
  imageUrl?: string;
  isEnrolled: boolean;
  priority?: boolean;
}

export function TrainingCard({
  id,
  title,
  tagline,
  imageUrl,
  isEnrolled,
  priority = false,
}: TrainingCardProps) {
  const router = useRouter();
  const fallbackImage = "/placeholder-training.svg?height=200&width=300";

  const navigateToDetails = () => {
    router.push(`/explore/${id}`);
  };

  return (
    <Card className="w-full min-h-[400px] flex flex-col hover:shadow-md hover:border-primary/50 transition-all duration-200">
      {/* Clickable area for navigation */}
      <div className="flex-grow cursor-pointer" onClick={navigateToDetails}>
        <CardHeader className="p-0 relative h-[200px]">
          <Image
            src={imageUrl || fallbackImage}
            alt={`Cover image for ${title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-xl font-bold line-clamp-2 mb-3">
            {title}
          </CardTitle>
          {tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {tagline}
            </p>
          )}
        </CardContent>
      </div>

      {/* Separate footer for enrollment button */}
      <CardFooter className="p-4 pt-0 flex justify-end mt-auto">
        <EnrollmentButton
          trainingId={id}
          className="w-auto"
          isEnrolled={isEnrolled}
        />
      </CardFooter>
    </Card>
  );
}
