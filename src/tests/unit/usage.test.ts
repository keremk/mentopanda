import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCurrentUsage,
  updateAssessmentUsage,
  SUBSCRIPTION_TIER_CREDITS,
  type SubscriptionTier,
  type AssessmentUpdate,
} from "@/data/usage";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("Usage Credit Initialization", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenario 1: No usage record exists (first time user)", () => {
    it("should create new usage record with correct period start and initialize credits for free tier", async () => {
      const expectedPeriodStart = "2024-05-15"; // User's creation date
      const expectedUsageId = 1;

      // Mock RPC call to get_or_create_current_usage
      mockSupabase.rpc.mockResolvedValue({
        data: expectedUsageId,
        error: null,
      });

      // Mock initial usage record fetch (newly created, all zeros)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: expectedUsageId,
                user_id: mockUserId,
                period_start: expectedPeriodStart,
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "0", // New record starts with 0
                used_credits: "0",
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      });

      // Mock profile fetch for subscription tier
      const profileSelectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { pricing_plan: "free" },
            error: null,
          }),
        })),
      }));

      // Mock credit initialization update
      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: expectedUsageId,
                user_id: mockUserId,
                period_start: expectedPeriodStart,
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100", // Free tier credits
                used_credits: "0",
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      }));

      // Setup the mock chain for different calls
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: expectedUsageId,
                  user_id: mockUserId,
                  period_start: expectedPeriodStart,
                  images: {},
                  assessment: {},
                  prompt_helper: {},
                  conversation: {},
                  transcription: {},
                  available_credits: "0",
                  used_credits: "0",
                  created_at: "2024-05-15T10:00:00Z",
                  updated_at: "2024-05-15T10:00:00Z",
                },
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: profileSelectMock,
        })
        .mockReturnValueOnce({
          update: updateMock,
        });

      const result = await getCurrentUsage(mockSupabase);

      expect(result).not.toBeNull();
      expect(result?.availableCredits).toBe(100); // Free tier
      expect(result?.usedCredits).toBe(0);
      expect(result?.periodStart).toEqual(new Date(expectedPeriodStart));

      // Verify RPC was called to get/create current usage
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_or_create_current_usage",
        {
          target_user_id: mockUserId,
        }
      );

      // Verify credit initialization happened
      expect(updateMock).toHaveBeenCalled();
    });

    it("should initialize credits correctly for different subscription tiers", async () => {
      const testCases: Array<{
        tier: SubscriptionTier;
        expectedCredits: number;
      }> = [
        { tier: "free", expectedCredits: 100 },
        { tier: "pro", expectedCredits: 1000 },
        { tier: "team", expectedCredits: 5000 },
        { tier: "enterprise", expectedCredits: 10000 },
      ];

      for (const { tier, expectedCredits } of testCases) {
        vi.clearAllMocks();

        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        });

        mockSupabase.rpc.mockResolvedValue({
          data: 1,
          error: null,
        });

        // Mock the chain of calls
        const updateMock = vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: mockUserId,
                  period_start: "2024-05-15",
                  images: {},
                  assessment: {},
                  prompt_helper: {},
                  conversation: {},
                  transcription: {},
                  available_credits: expectedCredits.toString(),
                  used_credits: "0",
                  created_at: "2024-05-15T10:00:00Z",
                  updated_at: "2024-05-15T10:00:00Z",
                },
                error: null,
              }),
            })),
          })),
        }));

        mockSupabase.from
          .mockReturnValueOnce({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 1,
                    user_id: mockUserId,
                    period_start: "2024-05-15",
                    images: {},
                    assessment: {},
                    prompt_helper: {},
                    conversation: {},
                    transcription: {},
                    available_credits: "0",
                    used_credits: "0",
                    created_at: "2024-05-15T10:00:00Z",
                    updated_at: "2024-05-15T10:00:00Z",
                  },
                  error: null,
                }),
              })),
            })),
          })
          .mockReturnValueOnce({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { pricing_plan: tier },
                  error: null,
                }),
              })),
            })),
          })
          .mockReturnValueOnce({
            update: updateMock,
          });

        const result = await getCurrentUsage(mockSupabase);

        expect(result?.availableCredits).toBe(expectedCredits);
        expect(result?.usedCredits).toBe(0);
      }
    });
  });

  describe("Scenario 2: First updateUsage call should trigger initialization", () => {
    it("should initialize credits when first usage update happens", async () => {
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

      // Mock getCurrentUsage to return uninitialized record first
      mockSupabase.rpc.mockResolvedValue({
        data: 1,
        error: null,
      });

      // Mock the sequence of calls for getCurrentUsage
      const profileSelectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { pricing_plan: "free" },
            error: null,
          }),
        })),
      }));

      const initUpdateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 1,
                user_id: mockUserId,
                period_start: "2024-05-15",
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100",
                used_credits: "0",
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      }));

      const usageUpdateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 1,
                user_id: mockUserId,
                period_start: "2024-05-15",
                images: {},
                assessment: {
                  "gpt-4o": {
                    promptTokens: { text: { cached: 0, notCached: 1000 } },
                    outputTokens: 500,
                    totalTokens: 1500,
                    requestCount: 1,
                    lastUpdated: "2024-05-15T10:00:00Z",
                  },
                },
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100",
                used_credits: "0.075", // Some small credit cost
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      }));

      // Setup the mock chain
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: mockUserId,
                  period_start: "2024-05-15",
                  images: {},
                  assessment: {},
                  prompt_helper: {},
                  conversation: {},
                  transcription: {},
                  available_credits: "0",
                  used_credits: "0",
                  created_at: "2024-05-15T10:00:00Z",
                  updated_at: "2024-05-15T10:00:00Z",
                },
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: profileSelectMock,
        })
        .mockReturnValueOnce({
          update: initUpdateMock,
        })
        .mockReturnValueOnce({
          update: usageUpdateMock,
        });

      const result = await updateAssessmentUsage(
        mockSupabase,
        assessmentUpdate
      );

      expect(result).not.toBeNull();
      expect(result.availableCredits).toBe(100);
      expect(result.usedCredits).toBeGreaterThan(0); // Should have some usage
      expect(result.assessment["gpt-4o"]).toBeDefined();
      expect(result.assessment["gpt-4o"].requestCount).toBe(1);
    });
  });

  describe("Scenario 3: Period transition (new billing cycle)", () => {
    it("should create new period when user moves to next billing cycle", async () => {
      // This test would require mocking the database function get_or_create_current_usage
      // to simulate period transition logic. The function should:
      // 1. Calculate current period start based on user creation date
      // 2. Create new record if current date is past the billing cycle
      // 3. Initialize credits for the new period

      const currentDate = new Date("2024-06-16T10:00:00Z"); // Past June 15th billing date
      const expectedNewPeriodStart = "2024-06-15"; // New billing cycle starts June 15th

      // Mock the RPC to return a new usage ID for the new period
      mockSupabase.rpc.mockResolvedValue({
        data: 2, // New usage record ID
        error: null,
      });

      // Mock fetching the new record (should be initialized with credits)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 2,
                user_id: mockUserId,
                period_start: expectedNewPeriodStart,
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100", // Fresh credits for new period
                used_credits: "0", // Reset usage
                created_at: currentDate.toISOString(),
                updated_at: currentDate.toISOString(),
              },
              error: null,
            }),
          })),
        })),
      });

      const result = await getCurrentUsage(mockSupabase);

      expect(result).not.toBeNull();
      expect(result?.periodStart).toEqual(new Date(expectedNewPeriodStart));
      expect(result?.availableCredits).toBe(100);
      expect(result?.usedCredits).toBe(0);

      // Verify the RPC was called with correct user ID
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_or_create_current_usage",
        {
          target_user_id: mockUserId,
        }
      );
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing profile gracefully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 1,
        error: null,
      });

      // Mock uninitialized usage record
      const profileSelectMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null, // No profile found
            error: null,
          }),
        })),
      }));

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 1,
                user_id: mockUserId,
                period_start: "2024-05-15",
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100", // Should default to free tier
                used_credits: "0",
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      }));

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: mockUserId,
                  period_start: "2024-05-15",
                  images: {},
                  assessment: {},
                  prompt_helper: {},
                  conversation: {},
                  transcription: {},
                  available_credits: "0",
                  used_credits: "0",
                  created_at: "2024-05-15T10:00:00Z",
                  updated_at: "2024-05-15T10:00:00Z",
                },
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: profileSelectMock,
        })
        .mockReturnValueOnce({
          update: updateMock,
        });

      const result = await getCurrentUsage(mockSupabase);

      expect(result?.availableCredits).toBe(100); // Should default to free tier
    });

    it("should handle existing initialized record correctly", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 1,
        error: null,
      });

      // Mock already initialized usage record
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 1,
                user_id: mockUserId,
                period_start: "2024-05-15",
                images: {},
                assessment: {},
                prompt_helper: {},
                conversation: {},
                transcription: {},
                available_credits: "100",
                used_credits: "25", // Already has some usage
                created_at: "2024-05-15T10:00:00Z",
                updated_at: "2024-05-15T10:00:00Z",
              },
              error: null,
            }),
          })),
        })),
      });

      const result = await getCurrentUsage(mockSupabase);

      expect(result?.availableCredits).toBe(100);
      expect(result?.usedCredits).toBe(25);

      // Should not trigger initialization since credits are already set
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only the initial fetch
    });
  });

  describe("Credit calculation verification", () => {
    it("should verify SUBSCRIPTION_TIER_CREDITS constants", () => {
      expect(SUBSCRIPTION_TIER_CREDITS.free).toBe(100);
      expect(SUBSCRIPTION_TIER_CREDITS.pro).toBe(1000);
      expect(SUBSCRIPTION_TIER_CREDITS.team).toBe(5000);
      expect(SUBSCRIPTION_TIER_CREDITS.enterprise).toBe(10000);
    });
  });
});
