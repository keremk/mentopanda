"use server";

import { updateHistoryEntryAction } from "../(app)/historyActions";
import { generateObject, generateText } from "ai";
import { getModuleByIdAction } from "@/app/(app)/moduleActions";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

async function generateAssessment(transcript: string, assessmentPrompt: string) {
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

async function calculateScore(assessment: string) {
  const systemPrompt = `
    Based on the provided assessment, calculate a score between 1 and 5.
    1 is the lowest score and 5 is the highest score. 5 is a perfect score, so not to be given lightly.
  `;

  const schema = z.object({
    score: z.number().min(1).max(5),
  });

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema, 
    system: systemPrompt,
    prompt: `Assessment text:\n${assessment}`,
  });
  return result.object.score;
}

export default async function analyseTranscript(
  transcript: string,
  historyEntryId: number,
  moduleId: number
) {
  const module = await getModuleByIdAction(moduleId);   
  if (!module) throw new Error("Module not found");

  const assessmentPrompt = module.modulePrompt.assessment;
  const assessment = await generateAssessment(transcript, assessmentPrompt);
  const score = await calculateScore(assessment);

  // Save the assessment
  await updateHistoryEntryAction({
    id: historyEntryId,
    assessmentText: assessment,
    assessmentScore: score,
  });

  return { assessment: assessment, score: score };
}


