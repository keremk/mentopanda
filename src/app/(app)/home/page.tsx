import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import { generateMockHeatmapData } from "@/lib/mock-data";
import { TrainingHistory } from "@/components/training-history";
import { EnrolledTrainingsList } from "@/components/enrolled-trainings-list";

export default function HomePage() {
  const mockHeatmapData = generateMockHeatmapData();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to MentoPanda</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <EnrolledTrainingsList />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-h-[300px]">
          <TrainingSessionsHeatmap data={mockHeatmapData} />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
          <TrainingHistory />
        </div>
      </div>
    </div>
  );
}
