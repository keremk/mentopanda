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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Check, Users } from "lucide-react";

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
  basePath?: string;
  creatorInfo?: {
    avatarUrl: string | null;
    displayName: string | null;
  };
  forkCount?: number;
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
  basePath = "/explore",
  creatorInfo,
  forkCount = 0,
}: TrainingCardProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const fallbackImage = resolvedTheme === "dark" ? "/placeholder-training-dark.svg?height=200&width=300" : "/placeholder-training.svg?height=200&width=300";

  const navigateToDetails = () => {
    router.push(`${basePath}/${id}`);
  };

  return (
    <TooltipProvider>
      <Card className="w-full min-h-[400px] flex flex-col hover:shadow-md hover:border-primary/50 transition-all duration-200">
      {/* Clickable area for navigation */}
      <div className="grow cursor-pointer" onClick={navigateToDetails}>
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
      <CardFooter className="p-4 pt-0 flex justify-between items-center mt-auto">
        <div className="shrink-0">
          {creatorInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background shadow-md cursor-pointer">
                  <AvatarImage 
                    src={creatorInfo.avatarUrl || ""} 
                    alt={`${creatorInfo.displayName || 'Creator'} avatar`} 
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                    {creatorInfo.displayName 
                      ? creatorInfo.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-3 bg-linear-to-br from-background/95 to-background/90 border-2 backdrop-blur-xs shadow-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-purple-600"></div>
                    <div className="font-semibold text-sm text-foreground">
                      {creatorInfo.displayName || 'Anonymous Creator'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground/80 border-l-2 border-muted/30 pl-2">
                    Training Creator
                  </div>
                  {forkCount > 0 && (
                    <div className="flex items-center justify-between p-2 bg-muted/20 rounded-md border border-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-500/10 rounded-full">
                          <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {forkCount} Fork{forkCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="shrink-0">
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
        </div>
      </CardFooter>
    </Card>
    </TooltipProvider>
  );
}
