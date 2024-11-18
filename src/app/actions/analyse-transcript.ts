"use server";

import { updateHistoryEntryAction } from "../(app)/historyActions";

export default async function analyseTranscript(
  transcript: string,
  historyEntryId: number
) {
  // TODO: Replace with actual AI analysis
  const mockAssessment = `
    <h3>Your Performance</h3>
    <ul>
      <li>You effectively addressed the performance issues.</li>
      <li>Your tone was constructive and supportive.</li>
      <li>Consider providing more specific examples in future conversations.</li>
      <li>The improvement plan was clear and actionable.</li>
    </ul>
  `;

  // Save the assessment
  await updateHistoryEntryAction({
    id: historyEntryId,
    assessmentText: mockAssessment,
    assessmentScore: 85, // TODO: Calculate actual score
  });

  return { assessment: mockAssessment };
}
