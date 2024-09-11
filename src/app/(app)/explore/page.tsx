"use client"

import { CourseGrid } from "@/components/course-grid"

export default function ExplorePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Explore Courses</h1>
      <CourseGrid />
    </div>
  )
}