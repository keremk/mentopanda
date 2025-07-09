import { RealtimeAgent } from "@openai/agents/realtime";

export function getPrepCoachAgent() {
  
  return new RealtimeAgent({
    name: "PrepCoach",
    voice: "sage",
  });
}