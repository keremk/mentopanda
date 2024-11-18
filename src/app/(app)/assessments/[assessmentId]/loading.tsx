import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssessmentLoading() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Conversation Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-lg text-muted-foreground">
              Your assessment is being prepared...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 