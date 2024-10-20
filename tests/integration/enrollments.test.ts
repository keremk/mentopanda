import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Enrollment, getEnrolledTrainings } from "@/data/enrollments";
import { setupTestClient } from "../utils/test-client";

describe("Enrollment Integration Tests", () => {
  let testUserId: string;
  let testTrainingId: number;
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

    // Enroll the test user in the test training
    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .insert({ user_id: testUserId, training_id: testTrainingId });
    if (enrollmentError) throw enrollmentError;
  });

  afterAll(async () => {
    if (!testUserId) {
      console.log("No test user ID found");
      return;
    }
    // Clean up: delete test enrollment, training, and user
    try {
      // Delete enrollments first
      await supabase.from("enrollments").delete().eq("user_id", testUserId);

      // Delete trainings
      await supabase.from("trainings").delete().eq("id", testTrainingId);

    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });

  it("should return enrolled trainings for the authenticated user", async () => {
    // Mock the auth.getUser to return our test user
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    } as any);

    const enrolledTrainings = await getEnrolledTrainings(supabase);

    expect(enrolledTrainings).toHaveLength(1);
    expect(enrolledTrainings[0]).toMatchObject<Partial<Enrollment>>({
      id: expect.any(Number),
      trainingTitle: "Test Training",
      trainingId: testTrainingId,
      createdAt: expect.any(String),
    });
  });
});
