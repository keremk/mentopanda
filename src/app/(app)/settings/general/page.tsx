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
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage your general account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>General settings content will go here...</p>
        </CardContent>
      </Card>
    </div>
  );
}
