"use client";

import { useState, useEffect } from "react";
import { EnrolledTrainings } from "@/components/enrolled-trainings";
import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import TrainingActivity from "@/components/training-activity";
import {
  generateMockHeatmapData,
  generateMockTrainingSessions,
  mockCourses,
} from "@/lib/mock-data";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function HomePage() {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [
      { i: "enrolled-trainings", x: 0, y: 0, w: 1, h: 8 },
      { i: "training-heatmap", x: 1, y: 0, w: 1, h: 5 },
      { i: "training-activity", x: 0, y: 1, w: 1, h: 8 },
    ],
    md: [
      { i: "enrolled-trainings", x: 0, y: 0, w: 1, h: 8 },
      { i: "training-heatmap", x: 0, y: 1, w: 1, h: 5 },
      { i: "training-activity", x: 0, y: 2, w: 1, h: 8 },
    ],
  });

  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mockHeatmapData = generateMockHeatmapData();
  const mockTrainingSessions = generateMockTrainingSessions();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to MentoPanda</h1>
      <ResponsiveGridLayout
        className={cn("layout", {
          "flex flex-col items-center": windowWidth < 1260,
        })}
        layouts={layouts}
        breakpoints={{ lg: 1260, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 2, md: 1, sm: 1, xs: 1, xxs: 1 }}
        rowHeight={40}
        width={windowWidth}
        onLayoutChange={(_: Layout[], layouts: Layouts) => setLayouts(layouts)}
        isDraggable={windowWidth >= 1260}
        isResizable={false}
        margin={[0, 20]}
        containerPadding={[0, 0]}
        draggableHandle=".drag-handle"
      >
        <div
          key="enrolled-trainings"
          className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-[620px]"
        >
          <EnrolledTrainings trainings={mockCourses} />
        </div>
        <div
          key="training-heatmap"
          className="bg-white rounded-lg shadow-md overflow-hidden max-h-[300px] w-full max-w-[620px]"
        >
          <TrainingSessionsHeatmap data={mockHeatmapData} />
        </div>
        <div
          key="training-activity"
          className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-[620px]"
        >
          <TrainingActivity sessions={mockTrainingSessions} />
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
