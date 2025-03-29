import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import { getHistoryEntryAction } from "@/app/actions/history-actions";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    moduleId,
    entryId,
    apiKey,
  }: { moduleId: number; entryId: number; apiKey?: string } = await req.json();

  const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

  const [module, historyEntry] = await Promise.all([
    getModuleByIdAction2(moduleId),
    getHistoryEntryAction(entryId),
  ]);

  if (!module) throw new Error("Module not found");
  if (!historyEntry) throw new Error("History entry not found");

  const assessmentPrompt = module.modulePrompt.assessment;

  const openai = createOpenAI({
    apiKey: finalApiKey,
  });

  const systemPrompt = `
    You are an expert in assessing human communication skills. Below you will find the specific instructions for this assessment:\n
    ${assessmentPrompt}\n
    Create a very detailed assessment properly formatted in markdown with clearly defined sections when you are presented the transcript of the conversation. Do not provide a score, only the assessment.
  `;
  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: `Transcript:\n
     ${historyEntry.transcriptText}
     `,
  });

  return result.toDataStreamResponse();
}
