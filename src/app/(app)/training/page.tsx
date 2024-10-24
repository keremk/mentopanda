import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
          <CardDescription>
            Training will happen here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Training content will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}
