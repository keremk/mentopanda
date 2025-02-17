import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { OnboardingData } from "../onboarding-flow";

type InviteTeamProps = {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
};

export function InviteTeam({ data, updateData }: InviteTeamProps) {
  function addEmail(email: string) {
    if (email && !data.teamEmails.includes(email)) {
      updateData({ teamEmails: [...data.teamEmails, email] });
    }
  }

  function removeEmail(email: string) {
    updateData({
      teamEmails: data.teamEmails.filter((e) => e !== email),
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("email") as HTMLInputElement;
    addEmail(input.value.trim());
    input.value = "";
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Invite Your Team</CardTitle>
        <CardDescription>
          Add team members to collaborate on your project
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="flex space-x-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="colleague@company.com"
            />
            <Button type="submit">Add</Button>
          </div>
        </form>

        {data.teamEmails.length > 0 && (
          <div className="space-y-2">
            <Label>Invited team members</Label>
            <div className="space-y-2">
              {data.teamEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmail(email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Don&apos;t worry, you can always invite more team members later.
        </p>
      </div>
    </>
  );
}
