import { EnrolledTrainings } from "@/components/enrolled-trainings";
import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import TrainingActivity from "@/components/training-activity";
import {
  generateMockHeatmapData,
  generateMockTrainingSessions,
} from "@/lib/mock-data";

export default function HomePage() {
  const mockHeatmapData = generateMockHeatmapData();
  const mockTrainingSessions = generateMockTrainingSessions();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Welcome to MentoPanda</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <EnrolledTrainings />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-h-[300px]">
          <TrainingSessionsHeatmap data={mockHeatmapData} />
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
          <TrainingActivity sessions={mockTrainingSessions} />
        </div>
      </div>
    </div>
  );
}
