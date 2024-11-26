import { getTrainingHistoryAction } from "@/app/actions/history-actions";
import Link from "next/link";

export default async function AssessmentsPage() {
  const history = await getTrainingHistoryAction(100);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Your Assessments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment List Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Assessment History</h2>
          <div className="space-y-4">
            {history.map((entry) => (
              <Link
                key={entry.id}
                href={`/assessments/${entry.id}`}
                className="block p-4 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium">{entry.trainingTitle}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {entry.moduleTitle}
                      </p>
                    </div>
                  </div>
                  {entry.assessmentScore !== null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      Score: {entry.assessmentScore}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {history.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No assessments completed yet
              </p>
            )}
          </div>
        </div>

        {/* Chart Section - Placeholder */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Assessment Analytics</h2>
          <div className="aspect-square bg-accent/10 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
