import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProjectMemberInfoAction } from "@/app/actions/project-actions";
import { getCurrentUserInfo } from "@/data/user";
import { createClient } from "@/utils/supabase/server";
import { MemberRoleSelector } from "@/components/member-role-selector";

export default async function TeamMemberPage(
  props: {
    params: Promise<{ memberId: string }>;
  }
) {
  const params = await props.params;

  const supabase = await createClient();
  const currentUser = await getCurrentUserInfo(supabase);
  const member = await getProjectMemberInfoAction(
    currentUser.currentProject.id,
    params.memberId
  );

  if (!member) return <div>Member not found</div>;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="container py-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="trainings">Trainings</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={member.avatar_url} alt={member.name} />
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
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
        </TabsContent>

        <TabsContent value="trainings">
          <Card>
            <CardHeader>
              <CardTitle>Trainings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Training content coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
