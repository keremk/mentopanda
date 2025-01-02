import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import { generateMockHeatmapData } from "@/lib/mock-data";
import { TrainingHistory } from "@/components/training-history";
import { EnrolledTrainingsCard } from "@/components/enrolled-trainings-card";

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-3 xl:col-span-2">
            <EnrolledTrainingsCard />
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2 xl:col-span-2">
            <TrainingSessionsHeatmap />
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-5 xl:col-span-4">
            <TrainingHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
