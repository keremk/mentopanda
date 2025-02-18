import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { EnrollmentButton } from "@/components/enrollment-button";

interface TrainingCardProps {
  id: number;
  title: string;
  tagline?: string;
  imageUrl?: string;
  isEnrolled: boolean;
}

export function TrainingCard({
  id,
  title,
  tagline,
  imageUrl,
  isEnrolled,
}: TrainingCardProps) {
  const fallbackImage = "/placeholder.svg?height=200&width=300";

  return (
    <Card className="w-full min-h-[400px] flex flex-col">
      <CardHeader className="p-0 relative h-[200px]">
        <Image
          src={imageUrl || fallbackImage}
          alt={`Cover image for ${title}`}
          fill
          className="object-cover"
          // layout="fill"
          // objectFit="cover"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold line-clamp-2 mb-3">
          {title}
        </CardTitle>
        {tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {tagline}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between mt-auto">
        <EnrollmentButton 
          trainingId={id} 
          className="flex-1 mr-2" 
          isEnrolled={isEnrolled}
        />
        <Button variant="secondary" className="flex-1 ml-2" asChild>
          <Link href={`/explore/${id}`}>
            <Info className="mr-2 h-4 w-4" />
            Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
