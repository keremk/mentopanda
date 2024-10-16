"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { SidebarContext } from "@/contexts/SidebarContext";
import { Training } from "@/data/trainings";

interface CourseGridProps {
  trainings: Training[];
}

export function CourseGrid({ trainings }: CourseGridProps) {
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
        setGridClass("grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4");
      }
    };

    updateGridClass();
    window.addEventListener("resize", updateGridClass);
    return () => window.removeEventListener("resize", updateGridClass);
  }, [isSidebarExpanded]);

  const handleAddCourse = (courseId: string) => {
    console.log(`Adding course ${courseId} to user's list`);
    // Implement the logic to add the course to the user's list
  };

  const handleShowDetails = (courseId: string) => {
    router.push(`/explore/${courseId}`);
  };

  return (
    <div className={`grid gap-6 px-4 ${gridClass}`}>
      {trainings.map((training) => (
        <CourseCard
          key={training.id}
          title={training.title}
          imageUrl={training.image_url}
          onAddCourse={() => handleAddCourse(training.id)}
          onShowDetails={() => handleShowDetails(training.id)}
        />
      ))}
    </div>
  );
}
