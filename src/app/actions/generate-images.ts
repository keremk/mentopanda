"use server";

import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client
import { getPathFromStorageUrl } from "@/lib/utils"; // Import helper
// Removed Buffer and Supabase client imports for now

// Ensure environment variables are set
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key environment variable");
}
// Check for Supabase admin credentials needed for image fetching
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  // Throw error only if needed later, but warn
  console.warn(
    "Missing Supabase URL or Service Role Key. Image editing via URL will fail."
  );
  // We don't throw here immediately as generation might still work without it.
}
// Removed Supabase URL check for this action

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define Zod types matching client-side types
const imageContextTypeSchema = z.enum(["training", "character", "user"]);
const imageAspectRatioSchema = z.enum(["landscape", "square"]);

// Updated schema for the action input
const generateImageSchema = z
  .object({
    contextId: z.string().min(1, "Context ID cannot be empty."),
    contextType: imageContextTypeSchema,
    aspectRatio: imageAspectRatioSchema,
    prompt: z.string(), // Can be empty if only refining
    style: z.string().optional(),
    includeContext: z.boolean().optional(), // Make includeContext optional
    existingImageUrl: z.string().url().optional(), // <<< ADDED: URL of image to edit/use as reference
    bucketName: z.string().min(1).optional(), // <<< ADDED: Required if existingImageUrl is provided
  })
  .refine(
    (data) => {
      // Require bucketName if existingImageUrl is provided
      if (data.existingImageUrl && !data.bucketName) {
        return false;
      }
      return true;
    },
    {
      message: "Bucket name is required when providing an existing image URL.",
      path: ["bucketName"], // Specify the path of the error
    }
  );

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
      existingImageUrl,
      bucketName,
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
    const imageSize = aspectRatio === "landscape" ? "1792x1024" : "1024x1024"; // Use DALL-E 3 sizes, assuming gpt-image-1 supports them
    console.log(`Generating image with size: ${imageSize}`);

    // 4. Call OpenAI API - Conditionally use edit or generate
    let image_base64: string | undefined;

    if (existingImageUrl && bucketName) {
      // --- Edit/Reference Image Logic ---
      console.log(`Using existing image: ${existingImageUrl}`);

      // Ensure Supabase Admin Client can be created
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        return {
          success: false,
          error:
            "Server configuration error: Missing Supabase credentials for image fetching.",
        };
      }
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const imagePath = getPathFromStorageUrl(existingImageUrl);
      if (!imagePath) {
        return {
          success: false,
          error: "Could not extract path from existing image URL.",
        };
      }

      console.log(`Fetching image from storage: ${bucketName}/${imagePath}`);
      const { data: blobData, error: downloadError } =
        await supabaseAdmin.storage.from(bucketName).download(imagePath);

      if (downloadError || !blobData) {
        console.error("Supabase download error:", downloadError);
        return {
          success: false,
          error: `Failed to download existing image: ${downloadError?.message ?? "Unknown error"}`,
        };
      }

      try {
        const filename = imagePath.split("/").pop() || "input-image.png"; // Basic filename extraction
        // Convert Blob to file format OpenAI SDK understands
        const imageFile = await toFile(blobData, filename, {
          type: blobData.type || "image/png", // Use Blob type or default
        });

        console.log(
          `Calling OpenAI images.edit for: ${filename} with size: ${imageSize}`
        );
        // Use images.edit with the fetched image
        const editSize = "1024x1024"; // Force size for images.edit based on SDK types
        const response = await openai.images.edit({
          model: "gpt-image-1", // Use gpt-image-1 model
          image: imageFile, // Pass the fetched image file
          prompt: finalPrompt,
          n: 1,
          size: editSize, // Use the fixed size for edit
        });
        image_base64 = response.data?.[0]?.b64_json;
      } catch (toFileError) {
        console.error("Error processing image blob:", toFileError);
        return {
          success: false,
          error: `Failed to process image file: ${toFileError instanceof Error ? toFileError.message : "Unknown error"}`,
        };
      }
    } else {
      // --- Generate New Image Logic ---
      console.log("Calling OpenAI images.generate");
      // Use dynamic size for generate based on aspect ratio
      const generateSize =
        aspectRatio === "landscape" ? "1792x1024" : "1024x1024";
      console.log(`Generating image with dynamic size: ${generateSize}`);
      const response = await openai.images.generate({
        model: "gpt-image-1", // Use gpt-image-1 model as instructed
        prompt: finalPrompt,
        n: 1,
        size: generateSize, // Use dynamic size for generate
      });
      image_base64 = response.data?.[0]?.b64_json;
    }

    // 5. Process result
    if (!image_base64) {
      console.error("OpenAI response missing b64_json"); // Log less verbosely now
      return {
        success: false,
        error: "Image generation/edit failed: No base64 data returned.",
      };
    }

    // 6. Return base64 data directly
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
