"use server";

import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client
import { getPathFromStorageUrl } from "@/lib/utils"; // Import helper
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "./aicontext-actions";
import { updateImageUsageAction } from "./usage-actions";
import { logger } from "@/lib/logger";
import { mapDimensionsToSize, type ImageQuality } from "@/data/usage";

// Define Zod types matching client-side types
const imageContextTypeSchema = z.enum(["training", "character", "user"]);
const imageAspectRatioSchema = z.enum(["landscape", "square"]);

// Helper function to get image quality from environment variable
function getImageQuality(): ImageQuality {
  const envQuality =
    process.env.NEXT_PUBLIC_IMAGE_GENERATION_QUALITY?.toLowerCase();

  switch (envQuality) {
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    default:
      // Default to high quality if not specified
      logger.info(
        `Image quality not specified in environment, defaulting to 'high'`
      );
      return "high";
  }
}

// Helper function to map aspect ratio to pixel dimensions
function mapAspectRatioToDimensions(
  aspectRatio: "landscape" | "square"
): "1536x1024" | "1024x1024" {
  switch (aspectRatio) {
    case "landscape":
      return "1536x1024";
    case "square":
      return "1024x1024";
    default:
      return "1024x1024"; // fallback
  }
}

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
    apiKey: z.string().optional(),
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

async function getImageFromSupabase(imageUrl: string, bucketName: string) {
  // Ensure Supabase Admin Client can be created
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

  const filename = imagePath.split("/").pop() || "input-image.png"; // Basic filename extraction
  // Convert Blob to file format OpenAI SDK understands
  const imageFile = await toFile(blobData, filename, {
    type: blobData.type || "image/png", // Use Blob type or default
  });

  return imageFile;
}

async function getContextForType(
  contextType: string,
  contextId: string
): Promise<string | undefined> {
  logger.debug(`Context fetching requested for ${contextType}: ${contextId}`);
  const id = parseInt(contextId); // Parse ID once

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
    logger.warn("Constructing prompt resulted in no segments. ");
    return undefined;
  }
}

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
    const openai = new OpenAI({
      apiKey: finalApiKey,
    });

    // 2. Construct the prompt server-side
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

    // 4. Call OpenAI API - Conditionally use edit or generate
    let image_base64: string | undefined;
    const imageQuality = getImageQuality();

    if (existingImageUrl && bucketName) {
      try {
        const imageFile = await getImageFromSupabase(
          existingImageUrl,
          bucketName
        );
        const startTime = Date.now(); // Start timer
        const response = await openai.images.edit({
          model: "gpt-image-1", // Use gpt-image-1 model
          image: imageFile, // Pass the fetched image file
          prompt: truncatedPrompt,
          n: 1,
        });
        const endTime = Date.now(); // End timer
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;

        image_base64 = response.data?.[0]?.b64_json;
        if (image_base64) {
          logger.info("===== GPT Image Usage (Edit) =====");
          logger.info(`Model: gpt-image-1`);
          logger.info(`Operation: edit`);
          logger.info(`Quality: ${imageQuality}`);
          logger.info(
            `API Call Elapsed Time: ${elapsedTimeInSeconds.toFixed(2)} seconds`
          );
          logger.info(`Input Prompt Characters: ${truncatedPrompt.length}`);
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
          logger.info("=================================");

          // Track usage in database
          try {
            const editDimensions = mapAspectRatioToDimensions(aspectRatio);
            await updateImageUsageAction({
              modelName: "gpt-image-1",
              quality: imageQuality, // Use environment-controlled quality
              size: mapDimensionsToSize(editDimensions), // Use the actual dimensions of the image being edited
              promptTokens: {
                text: {
                  cached: 0, // Image models typically don't have caching
                  notCached:
                    response.usage?.input_tokens_details?.text_tokens || 0,
                },
                image: {
                  cached: 0, // Image models typically don't have caching
                  notCached:
                    response.usage?.input_tokens_details?.image_tokens || 0,
                },
              },
              outputTokens: response.usage?.output_tokens || 0,
              totalTokens: response.usage?.total_tokens || 0,
              elapsedTimeSeconds: elapsedTimeInSeconds,
            });
            logger.info(`Usage tracked successfully for image edit`);
          } catch (usageError) {
            logger.error(`Failed to track image edit usage: ${usageError}`);
            // Don't fail the request if usage tracking fails
          }
        }
      } catch (toFileError) {
        logger.error("Error processing image blob:", toFileError);
        return {
          success: false,
          error: `Failed to process image file: ${toFileError instanceof Error ? toFileError.message : "Unknown error"}`,
        };
      }
    } else {
      // --- Generate New Image Logic ---
      const generateSize = mapAspectRatioToDimensions(aspectRatio);
      logger.debug(`Generating image with dynamic size: ${generateSize}`);
      const startTime = Date.now(); // Start timer
      const response = await openai.images.generate({
        model: "gpt-image-1", // Use gpt-image-1 model as instructed
        prompt: truncatedPrompt,
        quality: imageQuality, // Use environment-controlled quality
        n: 1,
        size: generateSize, // Use dynamic size for generate
      });
      const endTime = Date.now(); // End timer
      const elapsedTimeInSeconds = (endTime - startTime) / 1000;

      image_base64 = response.data?.[0]?.b64_json;
      if (image_base64) {
        logger.info("===== GPT Image Usage (Generate) =====");
        logger.info(`Model: gpt-image-1`);
        logger.info(`Operation: generate`);
        logger.info(`Quality: ${imageQuality}`);
        logger.info(
          `API Call Elapsed Time: ${elapsedTimeInSeconds.toFixed(2)} seconds`
        );
        logger.info(`Input Prompt Characters: ${truncatedPrompt.length}`);
        logger.info(`Image Size: ${generateSize}`);
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
        logger.info("====================================");

        // Track usage in database
        try {
          await updateImageUsageAction({
            modelName: "gpt-image-1",
            quality: imageQuality, // Use environment-controlled quality
            size: mapDimensionsToSize(generateSize),
            promptTokens: {
              text: {
                cached: 0, // Image models typically don't have caching
                notCached:
                  response.usage?.input_tokens_details?.text_tokens || 0,
              },
              image: {
                cached: 0, // Image models typically don't have caching
                notCached:
                  response.usage?.input_tokens_details?.image_tokens || 0,
              },
            },
            outputTokens: response.usage?.output_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
            elapsedTimeSeconds: elapsedTimeInSeconds,
          });
          logger.info(`Usage tracked successfully for image generation`);
        } catch (usageError) {
          logger.error(`Failed to track image generation usage: ${usageError}`);
          // Don't fail the request if usage tracking fails
        }
      }
    }

    // 5. Process result
    if (!image_base64) {
      logger.error("OpenAI response missing b64_json"); // Log less verbosely now
      return {
        success: false,
        error: "Image generation/edit failed: No base64 data returned.",
      };
    }

    // 6. Return base64 data directly
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
