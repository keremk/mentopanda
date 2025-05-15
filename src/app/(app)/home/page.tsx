import { TrainingSessionsHeatmap } from "@/components/training-sessions-heatmap";
import { TrainingHistory } from "@/components/training-history";
import { EnrolledTrainingsCard } from "@/components/enrolled-trainings-card";
import { InvitationNotifications } from "@/components/invitation-notifications";
import { Metadata } from "next";
import { getEnrolledTrainingsActionCached } from "@/app/actions/enrollment-actions";
import { getInvitationsForUserAction } from "@/app/actions/invitation-actions";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Home",
};

export default async function HomePage() {
  const user = await getCurrentUserActionCached();
  logger.debug(`User:`, JSON.stringify(user, null, 2));

  const [trainings, invitations] = await Promise.all([
    getEnrolledTrainingsActionCached(user),
    getInvitationsForUserAction(user),
  ]);

  return (
    <>
      <InvitationNotifications invitations={invitations} />
      <div className="container mx-auto p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-3 xl:col-span-2">
              <EnrolledTrainingsCard trainings={trainings} />
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2 xl:col-span-2">
              <TrainingSessionsHeatmap />
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-5 xl:col-span-4">
              <TrainingHistory />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
