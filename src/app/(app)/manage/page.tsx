import { getCurrentUserActionCached } from "@/app/actions/user-actions";
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

  return (
    <div className="container py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Management Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.permissions.includes("trials.manage") && (
          <Card>
            <CardHeader>
              <CardTitle>Trial Management</CardTitle>
              <CardDescription>
                Manage trial invitations and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Invite new users for trial access and manage existing trial
                invitations.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-hover w-full"
              >
                <Link href="/manage/trials">Manage Trials</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
