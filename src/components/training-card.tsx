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
import { AddPublicTraining } from "@/components/add-public-training";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";

interface TrainingCardProps {
  id: number;
  title: string;
  tagline?: string;
  imageUrl?: string;
  isEnrolled: boolean;
  priority?: boolean;
  isPublic?: boolean;
  isEnrollable?: boolean;
  isForked?: boolean;
}

export function TrainingCard({
  id,
  title,
  tagline,
  imageUrl,
  isEnrolled,
  priority = false,
  isEnrollable = true,
  isForked = false,
}: TrainingCardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const fallbackImage = resolvedTheme === "dark" ? "/placeholder-training-dark.svg?height=200&width=300" : "/placeholder-training.svg?height=200&width=300";

  const navigateToDetails = () => {
    router.push(`/explore/${id}`);
  };

  return (
    <Card className="w-full min-h-[400px] flex flex-col hover:shadow-md hover:border-primary/50 transition-all duration-200">
      {/* Clickable area for navigation */}
      <div className="flex-grow cursor-pointer" onClick={navigateToDetails}>
        <CardHeader className="p-0 relative h-[200px] p0 space-y-0">
          <Image
            src={imageUrl || fallbackImage}
            alt={`Cover image for ${title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          {isForked && (
            <div className="absolute inset-0 bg-background/60 dark:bg-background/60 flex items-center justify-center backdrop-blur-[2px] z-10">
              <div className="bg-brand/90 text-brand-foreground rounded-full p-3 shadow-lg border border-background">
                <Check className="h-5 w-5" />
              </div>
            </div>
          )}
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
        {isEnrollable ? (
          <EnrollmentButton
            trainingId={id}
            className="w-auto"
            isEnrolled={isEnrolled}
          />
        ) : (
          <AddPublicTraining
            trainingId={id}
            trainingTitle={title}
            className="w-auto"
            isForked={isForked}
          />
        )}
      </CardFooter>
    </Card>
  );
}
