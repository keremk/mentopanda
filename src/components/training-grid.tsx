"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { TrainingCard } from "@/components/training-card";
import { SidebarContext } from "@/contexts/SidebarContext";
import { Training } from "@/data/trainings";

interface TrainingGridProps {
  trainings: Training[];
}

export function TrainingGrid({ trainings }: TrainingGridProps) {
  const router = useRouter();
  const [gridClass, setGridClass] = useState("");
  const { isSidebarExpanded } = useContext(SidebarContext);

  useEffect(() => {
    const updateGridClass = () => {
      const width = window.innerWidth;
      if (isSidebarExpanded) {
        if (width < 1280) {
          setGridClass("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
        } else {
          setGridClass("grid-cols-1 sm:grid-cols-2 lg:grid-cols-3");
        }
      } else {
        setGridClass(
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        );
      }
    };

    updateGridClass();
    window.addEventListener("resize", updateGridClass);
    return () => window.removeEventListener("resize", updateGridClass);
  }, [isSidebarExpanded]);

  const handleAddTraining = (trainingId: string) => {
    console.log(`Adding training ${trainingId} to user's list`);
    // Implement the logic to add the training to the user's list
  };

  const handleShowDetails = (trainingId: string) => {
    router.push(`/explore/${trainingId}`);
  };

  return (
    <div className={`grid gap-6 px-4 ${gridClass}`}>
      {trainings.map((training) => (
        <TrainingCard
          key={training.id}
          title={training.title}
          tagline={training.tagline}
          imageUrl={training.image_url}
          onAddTraining={() => handleAddTraining(training.id)}
          onShowDetails={() => handleShowDetails(training.id)}
        />
      ))}
    </div>
  );
}
