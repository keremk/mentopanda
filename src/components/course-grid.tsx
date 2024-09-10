"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { mockCourses } from "@/lib/mock-data";

export function CourseGrid() {
  const [courses, setCourses] = useState(mockCourses);
  const router = useRouter();

  const handleAddCourse = (courseId: string) => {
    console.log(`Adding course ${courseId} to user's list`);
    // Implement the logic to add the course to the user's list
  };

  const handleShowDetails = (courseId: string) => {
    router.push(`/explore/${courseId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          title={course.title}
          imageUrl={course.imageUrl}
          onAddCourse={() => handleAddCourse(course.id)}
          onShowDetails={() => handleShowDetails(course.id)}
        />
      ))}
    </div>
  );
}
