import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { HistoryEntry, getHistoryEntry } from "@/data/history";
import { setupTestClient } from "@/tests/utils/test-client";

describe("History Integration Tests", () => {
  let testUserId: string;
  let testTrainingId: number;
  let testModuleId: number;
  let testHistoryId: number;
  let supabase: ReturnType<typeof setupTestClient>;

  beforeAll(async () => {
    supabase = setupTestClient();

    // Create a test user
    const testEmail = "testmember@example.com";
    const { data, error } = await supabase.rpc("get_user_id_by_email", {
      email: testEmail,
    });
    if (error) throw error;
    testUserId = data[0].id;

    // Create a test training
    const { data: trainingData, error: trainingError } = await supabase
      .from("trainings")
      .insert({ title: "Test Training", description: "Test Description" })
      .select()
      .single();
    if (trainingError) throw trainingError;
    testTrainingId = trainingData.id;

    // Create a test module
    const { data: moduleData, error: moduleError } = await supabase
      .from("modules")
      .insert({ 
        title: "Test Module", 
        training_id: testTrainingId 
      })
      .select()
      .single();
    if (moduleError) throw moduleError;
    testModuleId = moduleData.id;

    // Create a test history entry
    const { data: historyData, error: historyError } = await supabase
      .from("history")
      .insert({ 
        user_id: testUserId,
        module_id: testModuleId,
        started_at: new Date().toISOString(),
        assessment_text: "Test assessment",
        completed_at: new Date().toISOString()
      })
      .select()
      .single();
    if (historyError) throw historyError;
    testHistoryId = historyData.id;
  });

  afterAll(async () => {
    if (!testUserId) {
      console.log("No test user ID found");
      return;
    }
    // Clean up: delete test data in reverse order of creation
    try {
      await supabase.from("history").delete().eq("id", testHistoryId);
      await supabase.from("modules").delete().eq("id", testModuleId);
      await supabase.from("trainings").delete().eq("id", testTrainingId);
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });

  it("should return a history entry by ID for the authenticated user", async () => {
    // Mock the auth.getUser to return our test user
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    } as any);

    const historyEntry = await getHistoryEntry(supabase, testHistoryId);
  
    expect(historyEntry).toBeDefined();
    expect(historyEntry).toMatchObject<Partial<HistoryEntry>>({
      id: testHistoryId,
      moduleTitle: "Test Module",
      trainingTitle: "Test Training",
      assessmentText: "Test assessment",
      completedAt: expect.any(Date),
      startedAt: expect.any(Date)
    });
  });

  it("should return null for non-existent history entry", async () => {
    // Mock the auth.getUser to return our test user
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    } as any);

    const nonExistentId = 99999;
    const historyEntry = await getHistoryEntry(supabase, nonExistentId);

    expect(historyEntry).toBeNull();
  });

  it("should not return history entry belonging to another user", async () => {
    // Mock the auth.getUser to return a different user
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: "different-user-id" } },
      error: null,
    } as any);

    const historyEntry = await getHistoryEntry(supabase, testHistoryId);

    expect(historyEntry).toBeNull();
  });
});
