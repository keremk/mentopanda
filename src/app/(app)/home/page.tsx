import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import { generateMockHeatmapData } from "@/lib/mock-data";
import { TrainingHistory } from "@/components/training-history";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";

export default function HomePage() {

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <EnrolledTrainingsList />
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <TrainingSessionsHeatmap />
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
            <TrainingHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
