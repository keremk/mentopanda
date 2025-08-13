import Replicate from "replicate";
import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";
import { updateReplicateImageUsageAction } from "@/app/actions/usage-actions";
import {
  IMAGE_CONFIG,
  type ImageAspectRatio,
} from "@/lib/usage/types";

// Schema for the request body
const replicateImageGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  aspectRatio: z.enum(IMAGE_CONFIG.ASPECT_RATIOS),
  style: z.string().optional(),
});

// Map our aspect ratios to Replicate's format
function mapAspectRatioToReplicate(aspectRatio: ImageAspectRatio): string {
  switch (aspectRatio) {
    case "landscape":
      return "4:3";  // Closer to OpenAI's 3:2 (1536x1024) than 16:9
    case "square":
      return "1:1";
    case "portrait":
      return "3:4";  // Portrait version of 4:3
    default:
      return "1:1";
  }
}

// Construct the final prompt with style
function constructPrompt(prompt: string, style?: string): string {
  const promptSegments: string[] = [];

  if (style && style !== "custom") {
    promptSegments.push(`Style: ${style}`);
  }

  if (prompt) {
    promptSegments.push(prompt);
  }

  return promptSegments.join(". ");
}

// Track Replicate image usage
async function trackReplicateImageUsage(
  modelName: string,
  elapsedTimeInSeconds: number,
  imageCount: number = 1
) {
  try {
    // Fixed cost per image for Replicate - $0.02 per image
    const costPerImage = 0.02;

    logger.debug("📊 Tracking Replicate image usage:", {
      modelName,
      imageCount,
      costPerImage,
      elapsedTimeInSeconds,
    });

    await updateReplicateImageUsageAction({
      modelName,
      imageCount,
      costPerImage,
      elapsedTimeSeconds: elapsedTimeInSeconds,
    });
  } catch (error) {
    logger.error("Failed to track Replicate image usage:", error);
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
    const validationResult = replicateImageGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const { prompt, aspectRatio, style } = validationResult.data;

    // Check for Replicate API token
    if (!process.env.REPLICATE_API_TOKEN) {
      logger.error("Missing REPLICATE_API_TOKEN environment variable");
      return Response.json(
        { error: "Image generation service not configured" },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    logger.debug("🎯 Replicate image generation request:", {
      prompt: prompt.substring(0, 100) + "...",
      aspectRatio,
      style,
      mappedAspectRatio: mapAspectRatioToReplicate(aspectRatio),
    });

    const startTime = Date.now();

    // Construct the final prompt
    const finalPrompt = constructPrompt(prompt, style);

    // Prepare input for Replicate
    const input = {
      prompt: finalPrompt,
      aspect_ratio: mapAspectRatioToReplicate(aspectRatio),
      output_format: "png",
      safety_filter_level: "block_only_high",
    };

    logger.debug("🚀 Calling Replicate with input:", {
      ...input,
      prompt: input.prompt.substring(0, 100) + "...",
    });

    // Call Replicate
    type ReplicateImageOutput = { url: () => string };
    const output = await replicate.run("google/imagen-4-fast", { input }) as ReplicateImageOutput;

    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;

    logger.debug("✅ Replicate response received:", {
      hasOutput: !!output,
      elapsedTimeInSeconds,
    });

    // The output should have a url() method to get the image URL
    if (!output || typeof output.url !== "function") {
      logger.error("Invalid response from Replicate:", output);
      return Response.json(
        { error: "Invalid response from image generation service" },
        { status: 500 }
      );
    }

    const imageUrl = output.url();
    logger.debug(`📷 Image URL received: ...`);

    // Fetch the image from the URL and stream it back
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      logger.error("Failed to fetch image from URL:", {
        url: imageUrl,
        status: imageResponse.status,
        statusText: imageResponse.statusText,
      });
      return Response.json(
        { error: "Failed to fetch generated image" },
        { status: 500 }
      );
    }

    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    logger.info(`Replicate image generation completed in ${elapsedTimeInSeconds.toFixed(2)}s`);

    // Track usage for billing
    await trackReplicateImageUsage("google/imagen-4-fast", elapsedTimeInSeconds, 1);

    // Return the image data in the same format as the OpenAI endpoint
    return Response.json({
      success: true,
      imageData: imageBase64,
      elapsedTime: elapsedTimeInSeconds,
    });

  } catch (error) {
    logger.error("Replicate image generation error:", error);

    let errorMessage = "An unknown error occurred during image generation.";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for credit-related errors
      if (error.message.includes("credit") || error.message.includes("quota")) {
        errorMessage = "No credits available";
        statusCode = 402;
      }
    }

    return Response.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}