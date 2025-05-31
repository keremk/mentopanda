/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";
import { updateImageUsageAction } from "@/app/actions/usage-actions";
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "@/app/actions/aicontext-actions";
import {
  IMAGE_CONFIG,
  mapAspectRatioToSize,
  type ImageQuality,
  type ImageAspectRatio,
} from "@/lib/usage/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getPathFromStorageUrl } from "@/lib/utils";

// Schema for the request body
const imageGenerationSchema = z.object({
  contextId: z.string().min(1, "Context ID cannot be empty."),
  contextType: z.enum(["training", "character", "user"]),
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

// Get context data based on type
async function getContextForType(
  contextType: string,
  contextId: string
): Promise<string | undefined> {
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

// Construct the final prompt
async function constructPrompt(
  prompt: string,
  style: string | undefined,
  contextType: string,
  contextId: string,
  includeContext: boolean
): Promise<string> {
  const promptSegments: string[] = [];

  if (includeContext) {
    const context = await getContextForType(contextType, contextId);
    if (context) {
      promptSegments.push(`Context: ${context}`);
    }
  }

  if (style && style !== "custom") {
    promptSegments.push(`Style: ${style}`);
  }

  if (prompt) {
    promptSegments.push(`Description: ${prompt}`);
  }

  return promptSegments.length > 0
    ? promptSegments.join("\n\n")
    : "Generate a creative image";
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
      modelName: "gpt-image-1",
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
  // Create a stream for server-sent events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Helper function to send data
        const sendData = (data: any) => {
          const logData = { ...data };
          if (logData.imageData) {
            logData.imageData = `[base64 data: ${logData.imageData.length} chars]`;
          }
          logger.debug(
            "🚀 API: Sending event:",
            JSON.stringify(logData, null, 2)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        // Check credits first
        const creditCheck = await checkUserHasCredits();
        if (!creditCheck.hasCredits) {
          sendData({
            type: "error",
            error: creditCheck.error || "No credits available",
          });
          controller.close();
          return;
        }

        // Parse and validate request
        const body = await request.json();
        const validationResult = imageGenerationSchema.safeParse(body);

        if (!validationResult.success) {
          sendData({
            type: "error",
            error: "Invalid request parameters",
          });
          controller.close();
          return;
        }

        const requestData = validationResult.data;
        const apiKey = requestData.apiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
          sendData({
            type: "error",
            error: "Missing OpenAI API key",
          });
          controller.close();
          return;
        }

        const openai = new OpenAI({ apiKey });

        // Construct the prompt
        const finalPrompt = await constructPrompt(
          requestData.prompt,
          requestData.style,
          requestData.contextType,
          requestData.contextId,
          requestData.includeContext
        );

        const partialImagesCount = 3; // Number of partial images

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
            sendData({
              type: "error",
              error: "Failed to fetch existing image for editing",
            });
            controller.close();
            return;
          }

          logger.debug("Successfully fetched existing image for editing");
        }

        const totalSteps = partialImagesCount + 1; // +1 for the final complete image

        // Send initial status
        sendData({
          type: "status",
          message: existingImageBase64
            ? "Starting image editing..."
            : "Starting image generation...",
          step: 0,
          totalSteps: totalSteps,
        });

        const startTime = Date.now();

        // Prepare input for the OpenAI Responses API
        let apiInput: any;

        if (existingImageBase64) {
          // Use the new format for image editing with base64 data
          apiInput = [
            {
              role: "user",
              content: [
                { type: "input_text", text: finalPrompt },
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

        // Prepare the API call parameters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiParams: any = {
          model: "gpt-4.1",
          input: apiInput,
          stream: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [
            {
              type: "image_generation" as any,
              partial_images: partialImagesCount,
            } as any,
          ],
        };

        // Add previous_response_id for multi-turn image generation if provided
        if (requestData.previousResponseId) {
          apiParams.previous_response_id = requestData.previousResponseId;
          logger.debug(
            "Using previous response ID for multi-turn generation:",
            requestData.previousResponseId
          );
        }

        // Use the proper OpenAI Responses API with image_generation tool
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseStream = (await openai.responses.create(
          apiParams
        )) as any;

        let stepCount = 0;
        let lastPartialImage: string | null = null;

        for await (const event of responseStream) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eventType = (event as any).type;

          switch (eventType) {
            case "response.image_generation_call.partial_image": {
              stepCount++;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const imageBase64 = (event as any).partial_image_b64;
              lastPartialImage = imageBase64; // Store for fallback

              let message: string;

              if (existingImageBase64) {
                // Messages for image editing
                if (stepCount === 1) {
                  message = "Initial edits applied";
                } else if (stepCount === partialImagesCount) {
                  message = "Final editing touches";
                } else {
                  message = `Applying edits... (step ${stepCount})`;
                }
              } else {
                // Messages for new image generation
                if (stepCount === 1) {
                  message = "Initial concept generated";
                } else if (stepCount === partialImagesCount) {
                  message = "Final refinements";
                } else {
                  message = `Refining image... (step ${stepCount})`;
                }
              }

              // All partial images are sent as intermediate
              sendData({
                type: "intermediate",
                imageData: imageBase64,
                step: stepCount,
                totalSteps: totalSteps,
                message: message,
              });
              break;
            }

            case "response.image_generation_call.started": {
              stepCount++;
              sendData({
                type: "status",
                message: existingImageBase64
                  ? "Editing image..."
                  : "Generating images...",
                step: 1,
                totalSteps: totalSteps,
              });
              break;
            }

            case "response.image_generation_call.done": {
              logger.debug("🎯 API: Image generation call done event received");
              // This event might not contain final image data, wait for response.completed
              break;
            }

            case "response.completed": {
              const endTime = Date.now();
              const elapsedTimeInSeconds = (endTime - startTime) / 1000;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const response = (event as any).response;

              logger.debug("🏁 API: Response completed event received:", {
                responseId: response?.id,
                status: response?.status,
                hasUsage: !!response?.usage,
                usage: response?.usage,
                hasOutput: !!response?.output,
                outputLength: response?.output?.length,
                hasLastPartialImage: !!lastPartialImage,
                lastPartialImageLength: lastPartialImage?.length,
                stepCount,
              });

              // Check if there's a final complete image in the response output
              let finalCompleteImage: string | null = null;
              if (response?.output) {
                // Look for image content in the output
                for (const output of response.output) {
                  if (output?.content) {
                    for (const content of output.content) {
                      if (content?.type === "image" && content?.image_b64) {
                        finalCompleteImage = content.image_b64;
                        break;
                      }
                    }
                  }
                  if (finalCompleteImage) break;
                }
              }

              // Use final complete image if available, otherwise fall back to last partial
              const imageDataToSend: string | null =
                finalCompleteImage || lastPartialImage;

              if (imageDataToSend) {
                logger.debug(
                  `✅ API: Sending final event with image data length: ${imageDataToSend.length} Source: ${finalCompleteImage ? "response.output" : "lastPartialImage"}`
                );
                sendData({
                  type: "final",
                  imageData: imageDataToSend,
                  step: totalSteps,
                  totalSteps: totalSteps,
                  message: existingImageBase64
                    ? "Image editing complete"
                    : "Image generation complete",
                  responseId: response?.id, // Include response ID for multi-turn generation
                });
              } else {
                logger.error(
                  "❌ API: No final image data available, sending error"
                );
                sendData({
                  type: "error",
                  error: "No final image data available",
                });
              }

              // Track usage with proper token information from the response
              if (response?.usage) {
                logger.debug(
                  `📊 API: Tracking usage with token data: ${JSON.stringify(response.usage)}`
                );
                await trackImageUsage(
                  getImageQuality(),
                  requestData.aspectRatio,
                  elapsedTimeInSeconds,
                  response.usage
                );
              } else {
                logger.warn(
                  "⚠️ API: No usage data available, tracking with defaults"
                );
                await trackImageUsage(
                  getImageQuality(),
                  requestData.aspectRatio,
                  elapsedTimeInSeconds
                );
              }

              logger.info(
                `Image ${existingImageBase64 ? "editing" : "generation"} completed in ${elapsedTimeInSeconds.toFixed(2)}s with ${stepCount} images (via response.completed)`
              );
              break;
            }

            default: {
              // Log unknown event types for debugging
              logger.debug("Unknown event type received:", eventType);
              break;
            }
          }
        }
      } catch (error) {
        logger.error("Image generation error:", error);

        const sendData = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

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
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        sendData({
          type: "error",
          error: errorMessage,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
