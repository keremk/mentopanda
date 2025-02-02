"use server";

import { updateHistoryEntryAction } from "@/app/actions/history-actions";
import { generateText } from "ai";
import { getModuleByIdAction2 } from "@/app/(app)/moduleActions";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

async function generateAssessment(
  transcript: string,
  assessmentPrompt: string
) {
  const systemPrompt = `
    You are an expert in assessing human communication skills. Below you will find the specific instructions for this assessment:\n
    ${assessmentPrompt}\n
    Create a very detailed assessment properly formatted in markdown with clearly defined sections when you are presented the transcript of the conversation. Do not provide a score, only the assessment.
  `;

  const result = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: `Transcript:\n
     ${transcript}
     `,
  });
  return result.text;
}

export default async function analyseTranscript(
  transcript: string,
  historyEntryId: number,
  moduleId: number
) {
  const module = await getModuleByIdAction2(moduleId);
  if (!module) throw new Error("Module not found");

  const assessmentPrompt = module.modulePrompt.assessment;
  const assessment = await generateAssessment(transcript, assessmentPrompt);

  // Save the assessment
  await updateHistoryEntryAction({
    id: historyEntryId,
    assessmentText: assessment,
    assessmentCreated: true,
  });

  return { assessment: assessment };
}
