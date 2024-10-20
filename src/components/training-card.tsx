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
import { PlusCircle, Info, BookOpen } from "lucide-react";
import { EnrollmentButton } from "@/components/enrollment-button";

interface TrainingCardProps {
  id: number;
  title: string;
  tagline?: string;
  imageUrl?: string;
}

export function TrainingCard({
  id,
  title,
  tagline,
  imageUrl,
}: TrainingCardProps) {
  const fallbackImage = "/placeholder.svg?height=200&width=300";

  return (
    <Card className="w-full h-[350px] flex flex-col">
      <CardHeader className="p-0 relative aspect-video">
        <Image
          src={imageUrl || fallbackImage}
          alt={`Cover image for ${title}`}
          layout="fill"
          objectFit="cover"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold line-clamp-2 mb-2">
          {title}
        </CardTitle>
        {tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tagline}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <EnrollmentButton trainingId={id} className="flex-1 mr-2" />
        <Button
          variant="secondary"
          className="flex-1 ml-2"
          asChild
        >
          <Link href={`/explore/${id}`}>
            <Info className="mr-2 h-4 w-4" />
            Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
