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

// Define Zod types matching client-side types
const imageContextTypeSchema = z.enum(["training", "character", "user"]);
const imageAspectRatioSchema = z.enum(["landscape", "square"]);

// Updated schema for the action input
const generateImageSchema = z.object({
  contextId: z.string().min(1, "Context ID cannot be empty."),
  contextType: imageContextTypeSchema,
  aspectRatio: imageAspectRatioSchema,
  prompt: z.string(), // Can be empty if only refining
  style: z.string().optional(),
  includeContext: z.boolean().optional(), // Make includeContext optional
});

// Define the input type based on the schema - Removed as it's not strictly needed
// type GenerateImageInput = z.infer<typeof generateImageSchema>;

// Update ActionResult to return base64 data
type GenerateActionResult =
  | { success: true; imageData: string } // imageData is base64 string
  | { success: false; error: string };

export async function generateImageAction(
  input: unknown // Keep input as unknown for initial validation
): Promise<GenerateActionResult> {
  try {
    // 1. Validate input against the updated schema
    const validationResult = generateImageSchema.safeParse(input);
    if (!validationResult.success) {
      console.error("Invalid input:", validationResult.error.flatten());
      return {
        success: false,
        error:
          "Invalid input: " +
          validationResult.error.flatten().formErrors.join(", ") +
          ". " +
          validationResult.error.flatten().fieldErrors,
      };
    }
    const {
      contextId,
      contextType,
      aspectRatio,
      prompt,
      style,
      includeContext = false,
    } = validationResult.data;

    // 2. Construct the prompt server-side
    let finalPrompt = prompt; // Start with user's explicit prompt

    // === Scaffolding for Context Fetching ===
    if (
      includeContext &&
      (contextType === "training" || contextType === "character")
    ) {
      console.log(
        `Context fetching requested for ${contextType}: ${contextId}`
      );
      // TODO: Implement database fetching based on contextType and contextId
      // Example structure:
      /*
      const supabase = createSupabaseServerClient(); // Assuming you have this helper
      let contextText = "";
      if (contextType === "training") {
        const { data, error } = await supabase
          .from('trainings')
          .select('title, tagline, description')
          .eq('id', contextId)
          .single();
        if (!error && data) {
          contextText = `Based on Training (${data.title} - ${data.tagline}): ${data.description}\n\nUser Prompt:`;
        }
      } else if (contextType === "character") {
        const { data, error } = await supabase
          .from('characters')
          .select('name, description, aiDescription') // Fetch relevant fields
          .eq('id', contextId)
          .single();
         if (!error && data) {
           contextText = `Based on Character (${data.name}):\nDescription: ${data.description}\nAI Notes: ${data.aiDescription}\n\nUser Prompt:`;
         }
      }
      if (contextText) {
        finalPrompt = contextText + " " + finalPrompt;
      } else {
        console.warn(`Could not fetch context for ${contextType}: ${contextId}`);
        // Optionally add a generic prefix or handle error
         finalPrompt = `(Context Included - Fetch Failed) ` + finalPrompt; // Placeholder if fetch fails
      }
      */
      // Current placeholder:
      finalPrompt = `(Context Included for ${contextType}) ` + finalPrompt;
    }
    // === End Scaffolding ===

    if (style && style !== "custom") {
      finalPrompt += ` Style: ${style}.`;
    }

    // Limit prompt length (OpenAI has its own limits, but good practice)
    finalPrompt = finalPrompt.substring(0, 2000); // Increased limit slightly

    if (!finalPrompt.trim()) {
      return {
        success: false,
        error: "A prompt is required for image generation.",
      };
    }
    console.log("Server-side Final Prompt:", finalPrompt);

    // 3. Determine image size based on aspect ratio per user instruction
    const imageSize = aspectRatio === "landscape" ? "1536x1024" : "1024x1024";
    console.log(`Generating image with size: ${imageSize}`);

    // 4. Call OpenAI API using gpt-image-1 model and specified sizes
    const response = await openai.images.generate({
      model: "gpt-image-1", // Use gpt-image-1 model as instructed
      prompt: finalPrompt,
      n: 1,
      size: imageSize, 
    });

    const image_base64 = response.data?.[0]?.b64_json;

    if (!image_base64) {
      console.error("OpenAI response missing b64_json:", response.data);
      return {
        success: false,
        error: "Image generation failed: No base64 data returned from API.",
      };
    }

    // 5. Return base64 data directly
    return { success: true, imageData: image_base64 };
  } catch (error) {
    console.error("Image generation action error:", error);
    let errorMessage = "An unknown error occurred during image generation.";
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    return { success: false, error: `Action failed: ${errorMessage}` };
  }
}
