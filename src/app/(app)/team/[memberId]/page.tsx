import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProjectMemberInfoAction } from "@/app/actions/project-actions";
import { MemberRoleSelector } from "@/components/member-role-selector";
import { TrainingHistory } from "@/components/training-history";
import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { notFound } from "next/navigation";

export default async function TeamMemberPage(props: {
  params: Promise<{ memberId: string }>;
}) {
  const params = await props.params;
  const currentUser = await getCurrentUserActionCached();

  const member = await getProjectMemberInfoAction(
    currentUser.currentProject.id,
    params.memberId
  );

  if (!member) notFound();

  const initials =
    member.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "X";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={member.avatar_url} alt={member.name} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-6">
              <div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {member.email}
                </p>
              </div>
              <MemberRoleSelector
                projectId={currentUser.currentProject.id}
                memberId={member.id}
                currentRole={member.role}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <TrainingSessionsHeatmap forUserId={member.id} />
      <TrainingHistory forUserId={member.id} />
    </div>
  );
}
