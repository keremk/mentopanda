"use server";

import OpenAI from "openai";

export async function getToken() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const session = await openai.beta.realtime.sessions.create({
    model: "gpt-4o-realtime-preview",
    // tracing: {
    //   workflow_name: "MentoPanda mentor agent",
    // },
  });

  return session.client_secret.value;
}
