import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssessmentPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Conversation Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Your Performance</h3>
          <ul className="list-disc pl-5">
            <li>You effectively addressed the performance issues.</li>
            <li>Your tone was constructive and supportive.</li>
            <li>
              Consider providing more specific examples in future conversations.
            </li>
            <li>The improvement plan was clear and actionable.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
