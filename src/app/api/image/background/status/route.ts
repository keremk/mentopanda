/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { updateImageUsageAction } from "@/app/actions/usage-actions";
import {
  IMAGE_CONFIG,
  mapAspectRatioToSize,
  type ImageQuality,
  type ImageAspectRatio,
} from "@/lib/usage/types";
import { MODEL_NAMES } from "@/types/models";

// Schema for the request body
const statusRequestSchema = z.object({
  responseId: z.string(),
  aspectRatio: z.enum(IMAGE_CONFIG.ASPECT_RATIOS),
  apiKey: z.string().optional(),
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

// Track usage after image generation
async function trackImageUsage(
  imageQuality: ImageQuality,
  aspectRatio: ImageAspectRatio,
  elapsedTimeInSeconds: number,
  usageData?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    input_tokens_details?: {
      cached_tokens?: number;
    };
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
  }
) {
  try {
    const imageSize = mapAspectRatioToSize(aspectRatio);

    // Use actual usage data if available, otherwise fall back to zeros
    const inputTokens = usageData?.input_tokens || 0;
    const outputTokens = usageData?.output_tokens || 0;
    const totalTokens = usageData?.total_tokens || 0;
    const cachedTokens = usageData?.input_tokens_details?.cached_tokens || 0;
    const notCachedTokens = inputTokens - cachedTokens;

    logger.debug("📊 Tracking image usage:", {
      inputTokens,
      outputTokens,
      totalTokens,
      cachedTokens,
      notCachedTokens,
      elapsedTimeInSeconds,
      hasUsageData: !!usageData,
    });

    await updateImageUsageAction({
      modelName: MODEL_NAMES.OPENAI_GPT_IMAGE,
      quality: imageQuality,
      size: imageSize,
      promptTokens: {
        text: {
          cached: cachedTokens,
          notCached: notCachedTokens,
        },
        image: {
          cached: 0,
          notCached: 0, // No separate image input tokens for this use case
        },
      },
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      elapsedTimeSeconds: elapsedTimeInSeconds,
    });
  } catch (error) {
    logger.error("Failed to track image usage:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = statusRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const requestData = validationResult.data;
    const apiKey = requestData.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    logger.debug("🔍 Checking status for response:", {
      responseId: requestData.responseId,
    });

    // Retrieve the response status from OpenAI
    const response = await openai.responses.retrieve(requestData.responseId);

    logger.debug("📊 Response status:", {
      id: response.id,
      status: response.status,
      hasUsage: !!response.usage,
      hasOutput: !!response.output,
    });

    // Check if the response is still in progress
    if (response.status === "queued" || response.status === "in_progress") {
      return Response.json({
        status: response.status,
        message:
          response.status === "queued"
            ? "Request is queued..."
            : "Image generation in progress...",
      });
    }

    // Check if the response completed successfully
    if (response.status === "completed") {
      // Debug: Log the full response structure (without image data)
      logger.debug("🔍 Full response structure:", {
        id: response.id,
        status: response.status,
        outputType: typeof response.output,
        outputLength: Array.isArray(response.output)
          ? response.output.length
          : "not array",
        outputSummary: Array.isArray(response.output)
          ? response.output.map((item: any, index: number) => ({
              index,
              type: item?.type,
              status: item?.status,
              hasResult: !!item?.result,
              resultLength: item?.result ? item.result.length : 0,
              hasContent: !!item?.content,
              role: item?.role,
            }))
          : "not array",
      });

      // Extract the final image from the response output
      let finalCompleteImage: string | null = null;
      if (response.output) {
        // Log each output item to understand the structure (without image data)
        response.output.forEach((output, index) => {
          const outputAny = output as any;
          logger.debug(`🔍 Output item ${index}:`, {
            type: typeof output,
            keys: Object.keys(outputAny),
            itemType: outputAny?.type,
            status: outputAny?.status,
            hasResult: !!outputAny?.result,
            resultLength: outputAny?.result ? outputAny.result.length : 0,
            hasContent: !!outputAny?.content,
            contentLength: Array.isArray(outputAny?.content)
              ? outputAny.content.length
              : 0,
            role: outputAny?.role,
          });
        });

        // Look for image content in the output using type assertion for complex response structure
        for (const output of response.output) {
          // TypeScript workaround for complex union types in OpenAI response
          const outputAny = output as any;

          // Check for image_generation_call with direct result field (this is the correct structure!)
          if (
            outputAny?.type === "image_generation_call" &&
            outputAny?.result
          ) {
            finalCompleteImage = outputAny.result;
            logger.debug("✅ Found image in image_generation_call.result");
            break;
          }
          // Try other possible structures for image data
          else if (outputAny?.content) {
            for (const content of outputAny.content) {
              if (content?.type === "image" && content?.image_b64) {
                finalCompleteImage = content.image_b64;
                break;
              }
            }
          }
          // Check if image is directly in the output
          else if (outputAny?.type === "image" && outputAny?.image_b64) {
            finalCompleteImage = outputAny.image_b64;
            break;
          }
          // Check for tool call results
          else if (outputAny?.tool_calls) {
            for (const toolCall of outputAny.tool_calls) {
              if (toolCall?.type === "image_generation") {
                // Check various possible locations for the image data
                if (toolCall?.image_b64) {
                  finalCompleteImage = toolCall.image_b64;
                  break;
                } else if (toolCall?.result?.image_b64) {
                  finalCompleteImage = toolCall.result.image_b64;
                  break;
                } else if (toolCall?.function?.result?.image_b64) {
                  finalCompleteImage = toolCall.function.result.image_b64;
                  break;
                }
              }
            }
          }
          // Check if this is a message with tool_calls at the top level
          else if (outputAny?.role === "assistant" && outputAny?.tool_calls) {
            for (const toolCall of outputAny.tool_calls) {
              if (toolCall?.type === "image_generation") {
                if (toolCall?.image_b64) {
                  finalCompleteImage = toolCall.image_b64;
                  break;
                } else if (toolCall?.result?.image_b64) {
                  finalCompleteImage = toolCall.result.image_b64;
                  break;
                }
              }
            }
          }

          if (finalCompleteImage) break;
        }
      }

      if (finalCompleteImage) {
        // Track usage if available
        if (response.usage) {
          logger.debug(
            `📊 API: Tracking usage with token data: ${JSON.stringify(response.usage)}`
          );
          await trackImageUsage(
            getImageQuality(),
            requestData.aspectRatio,
            0, // We don't have elapsed time from the original request
            response.usage
          );
        }

        logger.debug("✅ Image generation completed successfully:", {
          responseId: response.id,
          imageDataLength: finalCompleteImage.length,
        });

        return Response.json({
          status: "completed",
          imageData: finalCompleteImage,
          responseId: response.id,
          message: "Image generation complete",
        });
      } else {
        logger.error("❌ Response completed but no image data found");
        return Response.json(
          { error: "Image generation completed but no image data found" },
          { status: 500 }
        );
      }
    }

    // Handle other terminal states (failed, cancelled, etc.)
    logger.error("❌ Image generation failed:", {
      responseId: response.id,
      status: response.status,
    });

    return Response.json(
      {
        error: `Image generation failed with status: ${response.status}`,
        status: response.status,
      },
      { status: 500 }
    );
  } catch (error) {
    logger.error("Status check error:", error);

    let errorMessage = "An unknown error occurred while checking status.";
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
