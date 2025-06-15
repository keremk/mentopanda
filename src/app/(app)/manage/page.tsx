import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { getWaitingListEntriesAction } from "@/app/actions/waiting-list-actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Management Dashboard",
};

export default async function ManagePage() {
  const user = await getCurrentUserActionCached();

  if (!user || !user.permissions.includes("trials.manage")) {
    notFound();
  }

  // Get waiting list entries count
  const waitlistEntries = await getWaitingListEntriesAction();
  const waitlistCount = waitlistEntries.length;

  return (
    <div className="container py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Management Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.permissions.includes("trials.manage") && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Codes</CardTitle>
              <CardDescription>
                Generate and manage invite codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Create invite codes for phone dictation and manage existing
                codes with expiration tracking.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-hover w-full"
              >
                <Link href="/manage/invite-codes">Manage Codes</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {user.permissions.includes("trials.manage") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Waiting List
                {waitlistCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {waitlistCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage people waiting for access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Review and approve waiting list entries by generating invite
                codes for accepted applicants.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-hover w-full"
              >
                <Link href="/manage/waitlist">Manage Waitlist</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
