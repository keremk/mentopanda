import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getCurrentUsage,
  updateAssessmentUsage,
  updateImageUsage,
  updateConversationUsage,
  updateTranscriptionUsage,
  updatePromptHelperUsage,
  updateReplicateImageUsage,
  type AssessmentUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
  type PromptHelperUpdate,
  type ReplicateImageUpdate,
  type ImageUsage,
} from "@/data/usage";
import {
  SUBSCRIPTION_TIER_CREDITS,
  type SubscriptionTier,
} from "@/lib/usage/types";
import { MODEL_NAMES } from "@/types/models";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
} from "@/tests/utils/test-setup";

// Type alias to extract the replicate image usage type
type ReplicateImageModelUsage = NonNullable<ImageUsage[string][string]> & {
  imageCount: number;
  costPerImage: number;
  totalCost: number;
  meanTimeElapsed: number;
  maxTimeElapsed: number;
  quality: string;
  size: string;
};

// Integration tests against real Supabase database
describe("Usage Database Integration Tests", () => {
  let adminSupabase: SupabaseClient;
  let projectIds: number[] = [];
  let userIds: string[] = [];
  let testUsageIds: number[] = []; // Keep this for usage-specific cleanup if needed

  beforeAll(async () => {
    // Create Supabase client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
      );
    }

    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterEach(async () => {
    // Manually clean up usage records
    if (testUsageIds.length > 0) {
      await adminSupabase.from("usage").delete().in("id", testUsageIds);
    }
    // Use the generic environment cleanup
    await cleanupTestEnvironment(adminSupabase, projectIds, userIds);

    // Reset arrays
    testUsageIds = [];
    projectIds = [];
    userIds = [];
  });

  describe("Credit Initialization", () => {
    it("should initialize credits correctly for new free tier user", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          {
            role: "member",
            projectName: "Usage-Init-Free",
            pricingPlan: "free",
          },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const usage = await getCurrentUsage(user.supabase);

      expect(usage).not.toBeNull();
      expect(usage?.subscriptionCredits).toBe(SUBSCRIPTION_TIER_CREDITS.free);
      expect(usage?.usedSubscriptionCredits).toBe(0);

      if (usage?.id) testUsageIds.push(usage.id);
    });

    it("should initialize credits correctly for different subscription tiers", async () => {
      const testCases: Array<{
        tier: SubscriptionTier;
        expectedCredits: number;
      }> = [
        { tier: "pro", expectedCredits: SUBSCRIPTION_TIER_CREDITS.pro },
        { tier: "team", expectedCredits: SUBSCRIPTION_TIER_CREDITS.team },
        {
          tier: "enterprise",
          expectedCredits: SUBSCRIPTION_TIER_CREDITS.enterprise,
        },
      ];

      for (const { tier, expectedCredits } of testCases) {
        const { createdUsers, createdProjectIds, createdUserIds } =
          await setupTestEnvironment(adminSupabase, [
            {
              role: "member",
              projectName: `Usage-Init-${tier}`,
              pricingPlan: tier,
            },
          ]);
        projectIds.push(...createdProjectIds);
        userIds.push(...createdUserIds);
        const user = createdUsers[0]!;

        const usage = await getCurrentUsage(user.supabase);

        expect(usage?.subscriptionCredits).toBe(expectedCredits);
        expect(usage?.usedSubscriptionCredits).toBe(0);

        if (usage?.id) testUsageIds.push(usage.id);
      }
    });
  });

  describe("Usage Tracking", () => {
    it("should track assessment usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Track", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const assessmentUpdate: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: { text: { cached: 0, notCached: 1000 } },
        outputTokens: 500,
        totalTokens: 1500,
      };

      const result = await updateAssessmentUsage(
        user.supabase,
        assessmentUpdate
      );

      expect(result).not.toBeNull();
      expect(result.assessment["gpt-4o"].requestCount).toBe(1);
      if (result.id) testUsageIds.push(result.id);
    });

    it("should track image usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Track", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const imageUpdate: ImageUpdate = {
        modelName: "gpt-image-1",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const result = await updateImageUsage(user.supabase, imageUpdate);
      const qualitySizeKey = "medium-square";
      expect(result.images["gpt-image-1"][qualitySizeKey].requestCount).toBe(1);
      if (result.id) testUsageIds.push(result.id);
    });

    it("should track conversation usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Track", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const conversationUpdate: ConversationUpdate = {
        modelName: MODEL_NAMES.OPENAI_REALTIME,
        promptTokens: {
          text: { cached: 0, notCached: 768 },
          audio: { cached: 0, notCached: 700 },
        },
        outputTokens: { text: 108, audio: 505 },
        totalTokens: 2081,
        totalSessionLength: 60,
      };

      const result = await updateConversationUsage(
        user.supabase,
        conversationUpdate
      );
      expect(
        result.conversation[MODEL_NAMES.OPENAI_REALTIME].requestCount
      ).toBe(1);
      if (result.id) testUsageIds.push(result.id);
    });

    it("should track transcription usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Track", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const transcriptionUpdate: TranscriptionUpdate = {
        modelName: MODEL_NAMES.OPENAI_WHISPER,
        totalSessionLength: 60,
        userChars: 235,
        agentChars: 712,
      };

      const result = await updateTranscriptionUsage(
        user.supabase,
        transcriptionUpdate
      );
      expect(
        result.transcription[MODEL_NAMES.OPENAI_WHISPER].requestCount
      ).toBe(1);
      if (result.id) testUsageIds.push(result.id);
    });

    it("should track prompt helper usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Track", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const promptHelperUpdate: PromptHelperUpdate = {
        modelName: "gpt-4o",
        promptTokens: { text: { cached: 0, notCached: 1500 } },
        outputTokens: 800,
        totalTokens: 2300,
      };

      const result = await updatePromptHelperUsage(
        user.supabase,
        promptHelperUpdate
      );
      expect(result.promptHelper[MODEL_NAMES.OPENAI_GPT4O].requestCount).toBe(
        1
      );
      if (result.id) testUsageIds.push(result.id);
    });

    it("should accumulate usage across multiple requests", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          {
            role: "member",
            projectName: "Usage-Accumulate",
            pricingPlan: "free",
          },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // First request
      await updateAssessmentUsage(user.supabase, {
        modelName: MODEL_NAMES.OPENAI_GPT4O,
        promptTokens: { text: { cached: 0, notCached: 1000 } },
        outputTokens: 500,
        totalTokens: 1500,
      });

      // Second request
      const secondResult = await updateAssessmentUsage(user.supabase, {
        modelName: MODEL_NAMES.OPENAI_GPT4O,
        promptTokens: { text: { cached: 0, notCached: 800 } },
        outputTokens: 400,
        totalTokens: 1200,
      });

      expect(
        secondResult.assessment[MODEL_NAMES.OPENAI_GPT4O].requestCount
      ).toBe(2);
      expect(
        secondResult.assessment[MODEL_NAMES.OPENAI_GPT4O].totalTokens
      ).toBe(2700);
      if (secondResult.id) testUsageIds.push(secondResult.id);
    });
  });

  describe("Replicate Image Usage Tracking", () => {
    it("should track replicate image usage correctly", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Replicate", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const replicateUpdate: ReplicateImageUpdate = {
        modelName: "google/imagen-4-fast",
        imageCount: 1,
        costPerImage: 0.02,
        elapsedTimeSeconds: 2.5,
      };

      const result = await updateReplicateImageUsage(user.supabase, replicateUpdate);

      expect(result).not.toBeNull();
      const replicateKey = "replicate-replicate";
      const replicateUsage = result.images["google/imagen-4-fast"]?.[replicateKey];
      
      expect(replicateUsage).toBeDefined();
      expect(replicateUsage?.requestCount).toBe(1);
      // Type assertion to access Replicate-specific fields
      const replicateData = replicateUsage as ReplicateImageModelUsage;
      expect(replicateData.imageCount).toBe(1);
      expect(replicateData.costPerImage).toBe(0.02);
      expect(replicateData.totalCost).toBe(0.02);
      expect(replicateData.meanTimeElapsed).toBe(2.5);
      expect(replicateData.maxTimeElapsed).toBe(2.5);
      expect(replicateData.quality).toBe("replicate");
      expect(replicateData.size).toBe("replicate");

      // Verify credit deduction: $0.02 * 1.5 margin / $0.05 per credit = 0.6 credits
      expect(result.usedSubscriptionCredits).toBeCloseTo(0.6, 2);
      
      if (result.id) testUsageIds.push(result.id);
    });

    it("should accumulate replicate usage across multiple requests", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Replicate-Multi", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // First request - 1 image, 2.0 seconds
      await updateReplicateImageUsage(user.supabase, {
        modelName: "google/imagen-4-fast",
        imageCount: 1,
        costPerImage: 0.02,
        elapsedTimeSeconds: 2.0,
      });

      // Second request - 2 images, 4.0 seconds  
      const secondResult = await updateReplicateImageUsage(user.supabase, {
        modelName: "google/imagen-4-fast",
        imageCount: 2,
        costPerImage: 0.02,
        elapsedTimeSeconds: 4.0,
      });

      const replicateKey = "replicate-replicate";
      const replicateUsage = secondResult.images["google/imagen-4-fast"]?.[replicateKey] as ReplicateImageModelUsage;
      
      expect(replicateUsage.requestCount).toBe(2);
      expect(replicateUsage.imageCount).toBe(3); // 1 + 2
      expect(replicateUsage.totalCost).toBeCloseTo(0.06, 2); // 3 * $0.02
      // Mean elapsed time: (2.0 * 1 + 4.0 * 1) / 2 = 3.0
      expect(replicateUsage.meanTimeElapsed).toBeCloseTo(3.0, 1);
      expect(replicateUsage.maxTimeElapsed).toBe(4.0);

      // Total credits used: 3 images * 0.6 credits = 1.8 credits
      expect(secondResult.usedSubscriptionCredits).toBeCloseTo(1.8, 2);

      if (secondResult.id) testUsageIds.push(secondResult.id);
    });

    it("should handle replicate and regular image usage separately", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "Usage-Mixed", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      // Add regular OpenAI image usage
      await updateImageUsage(user.supabase, {
        modelName: "gpt-image-1",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 100 },
          image: { cached: 0, notCached: 0 },
        },
        outputTokens: 0,
        totalTokens: 100,
      });

      // Add Replicate image usage for the same model name
      const result = await updateReplicateImageUsage(user.supabase, {
        modelName: "gpt-image-1", // Same model name
        imageCount: 1,
        costPerImage: 0.02,
        elapsedTimeSeconds: 1.5,
      });

      // Both should exist independently
      const regularKey = "medium-square";
      const replicateKey = "replicate-replicate";
      
      expect(result.images["gpt-image-1"]?.[regularKey]).toBeDefined();
      expect(result.images["gpt-image-1"]?.[replicateKey]).toBeDefined();
      
      // Verify they don't interfere with each other
      const regularUsage = result.images["gpt-image-1"]?.[regularKey];
      const replicateUsage = result.images["gpt-image-1"]?.[replicateKey] as ReplicateImageModelUsage;
      
      expect(regularUsage?.requestCount).toBe(1);
      expect(replicateUsage?.requestCount).toBe(1);
      expect(regularUsage?.totalTokens).toBe(100);
      expect(replicateUsage?.imageCount).toBe(1);

      if (result.id) testUsageIds.push(result.id);
    });
  });

  describe("Database Functions", () => {
    it("should test get_current_period_start function", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "DB-Func", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { data, error } = await adminSupabase.rpc(
        "get_current_period_start",
        {
          target_user_id: user.id,
        }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should test get_or_create_current_usage function", async () => {
      const { createdUsers, createdProjectIds, createdUserIds } =
        await setupTestEnvironment(adminSupabase, [
          { role: "member", projectName: "DB-Func-Usage", pricingPlan: "free" },
        ]);
      projectIds = createdProjectIds;
      userIds = createdUserIds;
      const user = createdUsers[0]!;

      const { data: usageId, error } = await adminSupabase.rpc(
        "get_or_create_current_usage",
        { target_user_id: user.id }
      );

      expect(error).toBeNull();
      expect(typeof usageId).toBe("number");
      if (usageId) testUsageIds.push(usageId);

      // Calling again should return the same usage ID
      const { data: sameUsageId } = await adminSupabase.rpc(
        "get_or_create_current_usage",
        { target_user_id: user.id }
      );
      expect(sameUsageId).toBe(usageId);
    });
  });
});
