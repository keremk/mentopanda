import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { AccountForm } from "./account-form";

export default async function AccountSettingsPage() {
  const user = await getCurrentUserAction({ includeOrgInfo: true });

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your general account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
