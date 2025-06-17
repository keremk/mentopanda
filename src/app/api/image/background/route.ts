// export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";
import {
  IMAGE_CONFIG,
  mapAspectRatioToDimensions,
  type ImageQuality,
} from "@/lib/usage/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getPathFromStorageUrl } from "@/lib/utils";
import { MODEL_NAMES } from "@/types/models";

// Schema for the request body
const imageGenerationSchema = z.object({
  aspectRatio: z.enum(IMAGE_CONFIG.ASPECT_RATIOS),
  prompt: z.string(),
  style: z.string().optional(),
  includeContext: z.boolean().optional().default(false),
  existingImageUrl: z.string().url().optional(),
  bucketName: z.string().min(1).optional(),
  apiKey: z.string().optional(),
  previousResponseId: z.string().optional(), // For multi-turn image generation
});

// Helper function to get image quality from environment variable
function getImageQuality(): ImageQuality {
  const envQuality =
    process.env.NEXT_PUBLIC_IMAGE_GENERATION_QUALITY?.toLowerCase();
  if (IMAGE_CONFIG.QUALITIES.includes(envQuality as ImageQuality)) {
    return envQuality as ImageQuality;
  }
  return "high";
}

// Construct the final prompt
async function constructPrompt(
  prompt: string,
  style: string | undefined
): Promise<string> {
  const promptSegments: string[] = [];

  // Add explicit instruction to generate an image
  promptSegments.push(
    "Please generate an image using the image_generation tool."
  );

  if (style && style !== "custom") {
    promptSegments.push(`Style: ${style}`);
  }

  if (prompt) {
    promptSegments.push(`Description: ${prompt}`);
  }

  return promptSegments.length > 1
    ? promptSegments.join("\n\n")
    : "Please generate an image using the image_generation tool.";
}

// Fetch image from Supabase storage and convert to base64
async function getImageAsBase64(
  imageUrl: string,
  bucketName: string
): Promise<string | null> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      logger.error(
        "Missing Supabase URL or Service Role Key for image fetching"
      );
      return null;
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const imagePath = getPathFromStorageUrl(imageUrl);
    if (!imagePath) {
      logger.error("Could not extract path from existing image URL:", imageUrl);
      return null;
    }

    logger.debug(`Fetching image from storage: ${bucketName}/${imagePath}`);
    const { data: blobData, error: downloadError } = await supabaseAdmin.storage
      .from(bucketName)
      .download(imagePath);

    if (downloadError || !blobData) {
      logger.error("Supabase download error:", downloadError);
      return null;
    }

    // Convert blob to base64
    const arrayBuffer = await blobData.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    logger.debug(
      `Successfully converted image to base64, length: ${base64String.length}`
    );
    return base64String;
  } catch (error) {
    logger.error("Error fetching image from storage:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check credits first
    const creditCheck = await checkUserHasCredits();
    if (!creditCheck.hasCredits) {
      return Response.json(
        { error: creditCheck.error || "No credits available" },
        { status: 402 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = imageGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const requestData = validationResult.data;
    const apiKey = requestData.apiKey || process.env.OPENAI_API_KEY;

    logger.debug("🎯 Image generation request:", {
      aspectRatio: requestData.aspectRatio,
      dimensions: mapAspectRatioToDimensions(requestData.aspectRatio),
      quality: getImageQuality(),
      hasExistingImage: !!requestData.existingImageUrl,
      hasPreviousResponseId: !!requestData.previousResponseId,
    });

    if (!apiKey) {
      return Response.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Construct the prompt
    const finalPrompt = await constructPrompt(
      requestData.prompt,
      requestData.style
    );

    // Check if we're editing an existing image
    let existingImageBase64: string | null = null;
    if (requestData.existingImageUrl && requestData.bucketName) {
      logger.debug(
        "Fetching existing image for editing:",
        requestData.existingImageUrl
      );
      existingImageBase64 = await getImageAsBase64(
        requestData.existingImageUrl,
        requestData.bucketName
      );

      if (!existingImageBase64) {
        return Response.json(
          { error: "Failed to fetch existing image for editing" },
          { status: 400 }
        );
      }

      logger.debug("Successfully fetched existing image for editing");
    }

    // Prepare input for the OpenAI Responses API
    let apiInput: any;

    if (existingImageBase64) {
      // Use the new format for image editing with base64 data
      apiInput = [
        {
          role: "user",
          content: [
            { type: "input_text", text: `Edit this image: ${finalPrompt}` },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${existingImageBase64}`,
            },
          ],
        },
      ];
      logger.debug("API Input for editing:", {
        promptLength: finalPrompt.length,
        imageLength: existingImageBase64.length,
        content: "Array with text and image",
      });
    } else {
      // Use the original text-only format for new image generation
      apiInput = finalPrompt;
      logger.debug("API Input for generation:", {
        promptLength: finalPrompt.length,
        content: "Text only",
      });
    }

    // Prepare the API call parameters for background mode
    const apiParams: any = {
      model: MODEL_NAMES.OPENAI_GPT41,
      input: apiInput,
      background: true, // Enable background mode
      tools: [
        {
          type: "image_generation" as any,
          size: mapAspectRatioToDimensions(requestData.aspectRatio),
          quality: getImageQuality(),
          moderation: "low",
        } as any,
      ],
      tool_choice: "required", // Force the model to use a tool
    };

    // Add previous_response_id for multi-turn image generation if provided
    if (requestData.previousResponseId) {
      apiParams.previous_response_id = requestData.previousResponseId;
      logger.debug(
        "Using previous response ID for multi-turn generation:",
        requestData.previousResponseId
      );
    }

    logger.debug("🔧 API Parameters:", {
      model: apiParams.model,
      inputType: typeof apiParams.input,
      inputIsArray: Array.isArray(apiParams.input),
      toolsCount: apiParams.tools.length,
      toolChoice: apiParams.tool_choice,
      background: apiParams.background,
      hasPreviousResponseId: !!apiParams.previous_response_id,
      imageSize: apiParams.tools[0].size,
      imageQuality: apiParams.tools[0].quality,
    });

    // Call OpenAI Responses API in background mode
    const response = await openai.responses.create(apiParams);

    logger.debug("🚀 Background response created:", {
      id: response.id,
      status: response.status,
    });

    // Return the response ID immediately for polling
    return Response.json({
      responseId: response.id,
      status: response.status,
    });
  } catch (error) {
    logger.error("Image generation error:", error);

    let errorMessage = "An unknown error occurred during image generation.";
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI Error: ${error.status} ${error.name} ${error.message}`;

      // Check for credit-related errors
      if (
        error.status === 402 ||
        error.message?.includes("credit") ||
        error.message?.includes("quota")
      ) {
        errorMessage = "No credits available";
        return Response.json({ error: errorMessage }, { status: 402 });
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
