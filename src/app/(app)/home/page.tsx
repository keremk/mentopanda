"use client"

import { useState, useEffect } from "react"
import { EnrolledTrainings } from "@/components/enrolled-trainings"
import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap"
import TrainingActivity from "@/components/training-activity"
import { generateMockHeatmapData, generateMockTrainingSessions, mockCourses } from "@/lib/mock-data"
import { Responsive, WidthProvider, Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function HomePage() {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [
      { i: "enrolled-trainings", x: 0, y: 0, w: 1, h: 8 },
      { i: "training-heatmap", x: 0, y: 8, w: 1, h: 10 }, // Increased height
      { i: "training-activity", x: 0, y: 18, w: 1, h: 12 },
    ],
  })

  const [windowWidth, setWindowWidth] = useState(1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mockHeatmapData = generateMockHeatmapData()
  const mockTrainingSessions = generateMockTrainingSessions()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to MentoPanda</h1>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 }}
        rowHeight={40} // Decreased row height to allow for finer control
        width={windowWidth}
        onLayoutChange={(layout, layouts) => setLayouts(layouts)}
        isDraggable={true}
        isResizable={false}
        margin={[0, 20]}
        containerPadding={[0, 0]}
        draggableHandle=".drag-handle"
      >
        <div key="enrolled-trainings" className="bg-white rounded-lg shadow-md overflow-hidden">
          <EnrolledTrainings trainings={mockCourses} />
        </div>
        <div key="training-heatmap" className="bg-white rounded-lg shadow-md overflow-hidden">
          <TrainingSessionsHeatmap data={mockHeatmapData} />
        </div>
        <div key="training-activity" className="bg-white rounded-lg shadow-md overflow-hidden">
          <TrainingActivity sessions={mockTrainingSessions} />
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}
