import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  apiKey?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body: RequestBody = await request.json();

    // Use provided API key or fall back to environment variable
    const apiKey = body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey)
      return NextResponse.json(
        { error: "OpenAI API key is required" },
        { status: 400 }
      );

    // Request token from OpenAI
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get speech token");
    }

    const token = await response.json();
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error getting OpenAI speech token:", error);
    return NextResponse.json(
      { error: "Failed to get speech token" },
      { status: 500 }
    );
  }
}
