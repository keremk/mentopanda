"use server";

import { z } from "zod";
import OpenAI from "openai";
// Removed Buffer and Supabase client imports for now

// Ensure environment variables are set
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key environment variable");
}
// Removed Supabase URL check for this action

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema now includes fields needed for server-side prompt generation
const generateImageSchema = z.object({
  trainingId: z.string().min(1, "Training ID cannot be empty."),
  prompt: z.string(), // Can be empty if only refining
  style: z.string().optional(),
  includeContext: z.boolean(),
  // lastSuccessfulPrompt: z.string().optional(), // Consider adding later if needed server-side
});

// Update ActionResult to return base64 data
type GenerateActionResult =
  | { success: true; imageData: string } // imageData is base64 string
  | { success: false; error: string };

export async function generateImageAction(
  input: unknown
): Promise<GenerateActionResult> {
  // Return GenerateActionResult
  try {
    // 1. Validate input
    const validationResult = generateImageSchema.safeParse(input);
    if (!validationResult.success) {
      console.error("Invalid input:", validationResult.error.flatten());
      return {
        success: false,
        error:
          "Invalid input: " +
          validationResult.error.flatten().formErrors.join(", "),
      };
    }
    const { trainingId, prompt, style, includeContext } = validationResult.data;

    // Acknowledge trainingId for linter until context fetch is implemented
    console.log(`Generating image for trainingId: ${trainingId}`);

    // 2. Construct the prompt server-side (Basic example - enhance later)
    let finalPrompt = prompt; // Start with user's explicit prompt
    if (includeContext) {
      // TODO: Fetch training details using trainingId from DB
      // const supabase = createSupabaseServerClient();
      // const { data: trainingData, error: dbError } = await supabase
      //    .from('trainings')
      //    .select('title, tagline, description')
      //    .eq('id', trainingId)
      //    .single();
      // if (dbError || !trainingData) { /* handle error */ }
      // else { finalPrompt = `Based on Training (${trainingData.title}): ` + finalPrompt; }
      finalPrompt = `(Context Included) ` + finalPrompt; // Placeholder
    }
    if (style && style !== "custom") {
      finalPrompt += ` Style: ${style}.`;
    }
    // Limit prompt length
    finalPrompt = finalPrompt.substring(0, 1000);
    if (!finalPrompt) {
      return {
        success: false,
        error: "A prompt is required for image generation.",
      };
    }
    console.log("Server-side Final Prompt:", finalPrompt);

    // 3. Call OpenAI API for Base64 JSON
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const image_base64 = response.data?.[0]?.b64_json;

    if (!image_base64) {
      console.error("OpenAI response missing b64_json:", response.data);
      return {
        success: false,
        error: "Image generation failed: No base64 data returned from API.",
      };
    }

    // 4. Return base64 data directly
    return { success: true, imageData: image_base64 };
  } catch (error) {
    console.error("Image generation action error:", error);
    let errorMessage = "An unknown error occurred during image generation.";
    if (error instanceof Error) errorMessage = error.message;
    else if (typeof error === "string") errorMessage = error;
    return { success: false, error: `Action failed: ${errorMessage}` };
  }
}
