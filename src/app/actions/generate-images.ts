"use server";

import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { createClient } from "@supabase/supabase-js";
import { getPathFromStorageUrl } from "@/lib/utils";
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "./aicontext-actions";
import { updateImageUsageAction } from "./usage-actions";
import { logger } from "@/lib/logger";
import {
  IMAGE_CONFIG,
  mapAspectRatioToDimensions,
  mapAspectRatioToSize,
  type ImageQuality,
  type ImageAspectRatio,
  type ImageSize,
  type ImageDimensions,
} from "@/lib/usage/types";

// Define Zod schemas using the centralized config
const imageContextTypeSchema = z.enum(["training", "character", "user"]);
const imageAspectRatioSchema = z.enum(IMAGE_CONFIG.ASPECT_RATIOS);

// Helper function to get image quality from environment variable
function getImageQuality(): ImageQuality {
  const envQuality =
    process.env.NEXT_PUBLIC_IMAGE_GENERATION_QUALITY?.toLowerCase();

  if (IMAGE_CONFIG.QUALITIES.includes(envQuality as ImageQuality)) {
    return envQuality as ImageQuality;
  }

  logger.info(
    "Image quality not specified in environment, defaulting to 'high'"
  );
  return "high";
}

// Updated schema for the action input
const generateImageSchema = z
  .object({
    contextId: z.string().min(1, "Context ID cannot be empty."),
    contextType: imageContextTypeSchema,
    aspectRatio: imageAspectRatioSchema,
    prompt: z.string(),
    style: z.string().optional(),
    includeContext: z.boolean().optional(),
    existingImageUrl: z.string().url().optional(),
    bucketName: z.string().min(1).optional(),
    apiKey: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.existingImageUrl && !data.bucketName) {
        return false;
      }
      return true;
    },
    {
      message: "Bucket name is required when providing an existing image URL.",
      path: ["bucketName"],
    }
  );

async function getImageFromSupabase(imageUrl: string, bucketName: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Server configuration error: Missing Supabase credentials for image fetching."
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const imagePath = getPathFromStorageUrl(imageUrl);
  if (!imagePath) {
    throw new Error("Could not extract path from existing image URL.");
  }

  logger.debug(`Fetching image from storage: ${bucketName}/${imagePath}`);
  const { data: blobData, error: downloadError } = await supabaseAdmin.storage
    .from(bucketName)
    .download(imagePath);

  if (downloadError || !blobData) {
    logger.error("Supabase download error:", downloadError);
    throw new Error(
      `Failed to download existing image: ${downloadError?.message ?? "Unknown error"}`
    );
  }

  const filename = imagePath.split("/").pop() || "input-image.png";
  const imageFile = await toFile(blobData, filename, {
    type: blobData.type || "image/png",
  });

  return imageFile;
}

async function getContextForType(
  contextType: string,
  contextId: string
): Promise<string | undefined> {
  logger.debug(`Context fetching requested for ${contextType}: ${contextId}`);
  const id = parseInt(contextId);

  switch (contextType) {
    case "training": {
      const trainingContext = await getAIContextDataForTrainingAction(
        id,
        undefined
      );
      return trainingContext
        ? `Description of the training that you will be generating a representative common image for: ${trainingContext?.training.description}`
        : undefined;
    }
    case "character": {
      const characterContext = await getAIContextDataForCharacterAction(id);
      return characterContext
        ? `Description of the character that you will be generating an image for: ${characterContext?.description}`
        : undefined;
    }
    default:
      return undefined;
  }
}

async function constructPrompt(
  prompt: string,
  style: string | undefined,
  contextType: string,
  contextId: string,
  includeContext: boolean
): Promise<string | undefined> {
  const promptSegments: string[] = [];

  if (includeContext) {
    const context = await getContextForType(contextType, contextId);
    if (context) {
      promptSegments.push(
        `When generating an image, consider the following context: \n ${context}`
      );
    }
  }

  if (style && style !== "custom") {
    promptSegments.push(`The style of the image should be: ${style}`);
  }

  if (prompt) {
    promptSegments.push(
      `Create an image that closely matches the following description: ${prompt}`
    );
  }

  if (promptSegments.length > 0) {
    return promptSegments.join("\n\n");
  } else {
    logger.warn("Constructing prompt resulted in no segments.");
    return undefined;
  }
}

// Consolidated logging function for image operations
function logImageUsage(
  operation: "generate" | "edit",
  response: OpenAI.Images.ImagesResponse,
  imageQuality: ImageQuality,
  elapsedTimeInSeconds: number,
  truncatedPrompt: string,
  dimensions?: ImageDimensions
) {
  logger.info(
    `===== GPT Image Usage (${operation.charAt(0).toUpperCase() + operation.slice(1)}) =====`
  );
  logger.info(`Model: gpt-image-1`);
  logger.info(`Operation: ${operation}`);
  logger.info(`Quality: ${imageQuality}`);
  logger.info(
    `API Call Elapsed Time: ${elapsedTimeInSeconds.toFixed(2)} seconds`
  );
  logger.info(`Input Prompt Characters: ${truncatedPrompt.length}`);

  if (dimensions) {
    logger.info(`Image Size: ${dimensions}`);
  }

  logger.info(`Created Timestamp: ${response.created}`);

  if (response.data?.[0]?.revised_prompt) {
    logger.info(
      `Revised Prompt Characters: ${response.data[0].revised_prompt.length}`
    );
  }

  if (response.usage) {
    logger.info("Token Usage:");
    logger.info(`  Input Tokens: ${response.usage.input_tokens}`);
    if (response.usage.input_tokens_details) {
      logger.info(
        `    Image Tokens (Input): ${response.usage.input_tokens_details.image_tokens}`
      );
      logger.info(
        `    Text Tokens (Input): ${response.usage.input_tokens_details.text_tokens}`
      );
    }
    logger.info(`  Output Tokens: ${response.usage.output_tokens}`);
    logger.info(`  Total Tokens: ${response.usage.total_tokens}`);
  }

  logger.info("=".repeat(operation === "generate" ? 36 : 33));
}

// Consolidated usage tracking function
async function trackImageUsage(
  operation: "generate" | "edit",
  response: OpenAI.Images.ImagesResponse,
  imageQuality: ImageQuality,
  imageSize: ImageSize,
  elapsedTimeInSeconds: number
) {
  try {
    await updateImageUsageAction({
      modelName: "gpt-image-1",
      quality: imageQuality,
      size: imageSize,
      promptTokens: {
        text: {
          cached: 0,
          notCached: response.usage?.input_tokens_details?.text_tokens || 0,
        },
        image: {
          cached: 0,
          notCached: response.usage?.input_tokens_details?.image_tokens || 0,
        },
      },
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      elapsedTimeSeconds: elapsedTimeInSeconds,
    });
    logger.info(`Usage tracked successfully for image ${operation}`);
  } catch (usageError) {
    logger.error(`Failed to track image ${operation} usage: ${usageError}`);
    // Don't fail the request if usage tracking fails
  }
}

// Consolidated image generation/edit function
async function processImageRequest(
  openai: OpenAI,
  truncatedPrompt: string,
  imageQuality: ImageQuality,
  aspectRatio: ImageAspectRatio,
  existingImageUrl?: string,
  bucketName?: string
): Promise<string | undefined> {
  const dimensions = mapAspectRatioToDimensions(aspectRatio);
  const imageSize = mapAspectRatioToSize(aspectRatio);
  const startTime = Date.now();

  let response: OpenAI.Images.ImagesResponse;
  let operation: "generate" | "edit";

  if (existingImageUrl && bucketName) {
    // Edit existing image
    operation = "edit";
    const imageFile = await getImageFromSupabase(existingImageUrl, bucketName);
    response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: truncatedPrompt,
      n: 1,
    });
  } else {
    // Generate new image
    operation = "generate";
    response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: truncatedPrompt,
      quality: imageQuality,
      n: 1,
      size: dimensions as "1024x1024" | "1536x1024" | "1024x1536",
    });
  }

  const endTime = Date.now();
  const elapsedTimeInSeconds = (endTime - startTime) / 1000;
  const image_base64 = response.data?.[0]?.b64_json;

  if (image_base64) {
    logImageUsage(
      operation,
      response,
      imageQuality,
      elapsedTimeInSeconds,
      truncatedPrompt,
      operation === "generate" ? dimensions : undefined
    );
    await trackImageUsage(
      operation,
      response,
      imageQuality,
      imageSize,
      elapsedTimeInSeconds
    );
  }

  return image_base64;
}

type GenerateActionResult =
  | { success: true; imageData: string }
  | { success: false; error: string };

export async function generateImageAction(
  input: unknown
): Promise<GenerateActionResult> {
  try {
    // 1. Validate input
    const validationResult = generateImageSchema.safeParse(input);
    if (!validationResult.success) {
      logger.error("Invalid input:", validationResult.error.flatten());
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const fieldErrorString = Object.entries(fieldErrors)
        .map(([key, value]) => `${key}: ${value?.join(", ")}`)
        .join("; ");
      return {
        success: false,
        error:
          "Invalid input: " +
          validationResult.error.flatten().formErrors.join(", ") +
          (fieldErrorString ? `. Field errors: ${fieldErrorString}` : ""),
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
      apiKey,
    } = validationResult.data;

    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalApiKey) {
      throw new Error("Missing OpenAI API key environment variable");
    }

    const openai = new OpenAI({ apiKey: finalApiKey });

    // 2. Construct the prompt
    const resolvedPrompt = await constructPrompt(
      prompt,
      style,
      contextType,
      contextId,
      includeContext
    );

    if (resolvedPrompt === undefined || !resolvedPrompt.trim()) {
      return {
        success: false,
        error: "A prompt is required for image generation.",
      };
    }

    const truncatedPrompt = resolvedPrompt.substring(0, 4000);
    logger.debug("Server-side Final Prompt:", truncatedPrompt);

    // 3. Process image request (generate or edit)
    const imageQuality = getImageQuality();
    const image_base64 = await processImageRequest(
      openai,
      truncatedPrompt,
      imageQuality,
      aspectRatio,
      existingImageUrl,
      bucketName
    );

    // 4. Process result
    if (!image_base64) {
      logger.error("OpenAI response missing b64_json");
      return {
        success: false,
        error: "Image generation/edit failed: No base64 data returned.",
      };
    }

    return { success: true, imageData: image_base64 };
  } catch (error) {
    logger.error("Image generation action error:", error);
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
