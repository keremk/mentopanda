import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserAction } from "@/app/actions/user-actions";

export default async function AccountSettingsPage() {
  const user = await getCurrentUserAction();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
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