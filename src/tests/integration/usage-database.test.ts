import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getCurrentUsage,
  updateAssessmentUsage,
  updateImageUsage,
  updateConversationUsage,
  updateTranscriptionUsage,
  updatePromptHelperUsage,
  type AssessmentUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
  type PromptHelperUpdate,
} from "@/data/usage";
import {
  SUBSCRIPTION_TIER_CREDITS,
  type SubscriptionTier,
} from "@/lib/usage/types";

// Integration tests against real Supabase database
describe("Usage Database Integration Tests", () => {
  let supabase: SupabaseClient;
  let testUserIds: string[] = [];
  let testUsageIds: number[] = [];
  let testCounter = 0; // Add counter for unique test data

  beforeAll(async () => {
    // Create Supabase client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
      );
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterAll(async () => {
    // Final cleanup - remove any remaining test data
    await cleanupTestData();
  });

  beforeEach(() => {
    // Reset tracking arrays for each test and increment counter
    testUserIds = [];
    testUsageIds = [];
    testCounter++;
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Delete usage records first (due to foreign key constraints)
      if (testUsageIds.length > 0) {
        await supabase.from("usage").delete().in("id", testUsageIds);
      }

      // Delete test users and their profiles
      if (testUserIds.length > 0) {
        // Delete profiles first
        await supabase.from("profiles").delete().in("id", testUserIds);

        // Delete auth users
        for (const userId of testUserIds) {
          await supabase.auth.admin.deleteUser(userId);
        }
      }
    } catch (error) {
      console.warn("Cleanup error (may be expected):", error);
    }
  }

  async function createTestUser(
    emailPrefix: string,
    pricingPlan: SubscriptionTier = "free"
  ): Promise<string> {
    // Create unique email using test counter to avoid conflicts
    const email = `${emailPrefix}-${testCounter}@example.com`;

    // Create auth user - the trigger will automatically create the profile
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: "test-password-123",
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;
    testUserIds.push(userId);

    // Update the profile with the desired pricing plan and current_project_id
    // (the trigger creates it with just the id)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pricing_plan: pricingPlan,
        current_project_id: 1, // Assuming project 1 exists
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return userId;
  }

  describe("Credit Initialization", () => {
    it("should initialize credits correctly for new free tier user", async () => {
      const userId = await createTestUser("test-free", "free");

      // Mock authenticated user for getCurrentUsage
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const usage = await getCurrentUsage(supabase);

      expect(usage).not.toBeNull();
      expect(usage?.subscriptionCredits).toBe(SUBSCRIPTION_TIER_CREDITS.free);
      expect(usage?.usedSubscriptionCredits).toBe(0);
      expect(usage?.purchasedCredits).toBe(0);
      expect(usage?.usedPurchasedCredits).toBe(0);
      expect(usage?.periodStart).toBeInstanceOf(Date);

      if (usage?.id) {
        testUsageIds.push(usage.id);
      }
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
        const userId = await createTestUser(`test-${tier}`, tier);

        supabase.auth.getUser = vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        });

        const usage = await getCurrentUsage(supabase);

        expect(usage?.subscriptionCredits).toBe(expectedCredits);
        expect(usage?.usedSubscriptionCredits).toBe(0);
        expect(usage?.purchasedCredits).toBe(0);
        expect(usage?.usedPurchasedCredits).toBe(0);

        if (usage?.id) {
          testUsageIds.push(usage.id);
        }
      }
    });
  });

  describe("Usage Tracking", () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = await createTestUser("test-usage", "free");
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: testUserId } },
        error: null,
      });
    });

    it("should track assessment usage correctly", async () => {
      const assessmentUpdate: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1000,
          },
        },
        outputTokens: 500,
        totalTokens: 1500,
      };

      const result = await updateAssessmentUsage(supabase, assessmentUpdate);

      expect(result).not.toBeNull();
      expect(result.assessment["gpt-4o"]).toBeDefined();
      expect(result.assessment["gpt-4o"].requestCount).toBe(1);
      expect(result.assessment["gpt-4o"].totalTokens).toBe(1500);
      expect(
        result.usedSubscriptionCredits + result.usedPurchasedCredits
      ).toBeGreaterThan(0);

      if (result.id) {
        testUsageIds.push(result.id);
      }
    });

    it("should track image usage correctly", async () => {
      const imageUpdate: ImageUpdate = {
        modelName: "gpt-image-1",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const result = await updateImageUsage(supabase, imageUpdate);

      expect(result).not.toBeNull();
      expect(result.images["gpt-image-1"]).toBeDefined();

      // Image usage has a nested structure: model -> quality-size key -> usage data
      const qualitySizeKey = "medium-square";
      expect(result.images["gpt-image-1"][qualitySizeKey]).toBeDefined();
      expect(result.images["gpt-image-1"][qualitySizeKey].requestCount).toBe(1);
      expect(
        result.usedSubscriptionCredits + result.usedPurchasedCredits
      ).toBeGreaterThan(0);

      if (result.id) {
        testUsageIds.push(result.id);
      }
    });

    it("should track conversation usage correctly", async () => {
      const conversationUpdate: ConversationUpdate = {
        modelName: "gpt-4o-realtime-preview",
        promptTokens: {
          text: { cached: 0, notCached: 768 },
          audio: { cached: 0, notCached: 700 },
        },
        outputTokens: {
          text: 108,
          audio: 505,
        },
        totalTokens: 2081,
        totalSessionLength: 60,
      };

      const result = await updateConversationUsage(
        supabase,
        conversationUpdate
      );

      expect(result).not.toBeNull();
      expect(result.conversation["gpt-4o-realtime-preview"]).toBeDefined();
      expect(result.conversation["gpt-4o-realtime-preview"].requestCount).toBe(
        1
      );
      expect(
        result.conversation["gpt-4o-realtime-preview"].totalSessionLength
      ).toBe(60);
      expect(
        result.usedSubscriptionCredits + result.usedPurchasedCredits
      ).toBeGreaterThan(0);

      if (result.id) {
        testUsageIds.push(result.id);
      }
    });

    it("should track transcription usage correctly", async () => {
      const transcriptionUpdate: TranscriptionUpdate = {
        modelName: "whisper-1",
        totalSessionLength: 60,
        userChars: 235,
        agentChars: 712,
      };

      const result = await updateTranscriptionUsage(
        supabase,
        transcriptionUpdate
      );

      expect(result).not.toBeNull();
      expect(result.transcription["whisper-1"]).toBeDefined();
      expect(result.transcription["whisper-1"].requestCount).toBe(1);
      expect(result.transcription["whisper-1"].totalSessionLength).toBe(60);
      expect(
        result.usedSubscriptionCredits + result.usedPurchasedCredits
      ).toBeGreaterThan(0);

      if (result.id) {
        testUsageIds.push(result.id);
      }
    });

    it("should track prompt helper usage correctly", async () => {
      const promptHelperUpdate: PromptHelperUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1500,
          },
        },
        outputTokens: 800,
        totalTokens: 2300,
      };

      const result = await updatePromptHelperUsage(
        supabase,
        promptHelperUpdate
      );

      expect(result).not.toBeNull();
      expect(result.promptHelper["gpt-4o"]).toBeDefined();
      expect(result.promptHelper["gpt-4o"].requestCount).toBe(1);
      expect(result.promptHelper["gpt-4o"].totalTokens).toBe(2300);
      expect(
        result.usedSubscriptionCredits + result.usedPurchasedCredits
      ).toBeGreaterThan(0);

      if (result.id) {
        testUsageIds.push(result.id);
      }
    });

    it("should accumulate usage across multiple requests", async () => {
      // First assessment request
      const firstAssessment: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: { text: { cached: 0, notCached: 1000 } },
        outputTokens: 500,
        totalTokens: 1500,
      };

      const firstResult = await updateAssessmentUsage(
        supabase,
        firstAssessment
      );
      const firstUsedCredits =
        firstResult.usedSubscriptionCredits + firstResult.usedPurchasedCredits;

      // Second assessment request
      const secondAssessment: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: { text: { cached: 0, notCached: 800 } },
        outputTokens: 400,
        totalTokens: 1200,
      };

      const secondResult = await updateAssessmentUsage(
        supabase,
        secondAssessment
      );

      expect(secondResult.assessment["gpt-4o"].requestCount).toBe(2);
      expect(secondResult.assessment["gpt-4o"].totalTokens).toBe(2700); // 1500 + 1200
      expect(
        secondResult.usedSubscriptionCredits + secondResult.usedPurchasedCredits
      ).toBeGreaterThan(firstUsedCredits);

      if (secondResult.id) {
        testUsageIds.push(secondResult.id);
      }
    });
  });

  describe("Database Functions", () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = await createTestUser("test-db-functions", "free");
    });

    it("should test get_current_period_start function", async () => {
      const { data, error } = await supabase.rpc("get_current_period_start", {
        target_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe("string");

      // Should be a valid date string
      const periodStart = new Date(data);
      expect(periodStart).toBeInstanceOf(Date);
      expect(periodStart.getTime()).not.toBeNaN();
    });

    it("should test get_or_create_current_usage function", async () => {
      const { data: usageId, error } = await supabase.rpc(
        "get_or_create_current_usage",
        {
          target_user_id: testUserId,
        }
      );

      expect(error).toBeNull();
      expect(usageId).toBeDefined();
      expect(typeof usageId).toBe("number");

      if (usageId) {
        testUsageIds.push(usageId);
      }

      // Calling again should return the same usage ID
      const { data: sameUsageId, error: secondError } = await supabase.rpc(
        "get_or_create_current_usage",
        {
          target_user_id: testUserId,
        }
      );

      expect(secondError).toBeNull();
      expect(sameUsageId).toBe(usageId);
    });

    it("should handle non-existent user gracefully", async () => {
      const fakeUserId = "00000000-0000-0000-0000-000000000000";

      const { error } = await supabase.rpc("get_current_period_start", {
        target_user_id: fakeUserId,
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain("User not found");
    });
  });

  describe("Period Transitions", () => {
    it("should handle period transitions correctly", async () => {
      // This test would require manipulating dates or waiting for actual time to pass
      // For now, we'll test that the period calculation works with different user creation dates

      // Create user with a specific creation date by updating the profile after creation
      const userId = await createTestUser("test-period", "free");

      // Update the profile's created_at to simulate an older user
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2); // 2 months ago

      await supabase
        .from("profiles")
        .update({ created_at: pastDate.toISOString() })
        .eq("id", userId);

      // Test that period calculation works
      const { data: periodStart, error } = await supabase.rpc(
        "get_current_period_start",
        {
          target_user_id: userId,
        }
      );

      expect(error).toBeNull();
      expect(periodStart).toBeDefined();

      const periodDate = new Date(periodStart);
      expect(periodDate).toBeInstanceOf(Date);

      // Period should be based on the user's creation date pattern
      expect(periodDate.getDate()).toBe(pastDate.getDate());
    });
  });
});
