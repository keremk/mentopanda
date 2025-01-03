import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
  RoomServiceClient,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { ModulePrompt } from "@/data/modules";
import { getModuleByIdAction2 } from "@/app/(app)/moduleActions";
import { getCurrentUserAction } from "@/app/actions/user-actions";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET(request: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }

    // Get moduleId and trainingId from query parameter
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    if (!moduleId) throw new Error("moduleId is required");
    
    const module = await getModuleByIdAction2(parseInt(moduleId));
    if (!module) throw new Error("Module not found");

    const userInfo = await getCurrentUserAction();
    const participantIdentity = userInfo.displayName;

    const prompt = createPrompt(module.modulePrompt);
    const voice = module.modulePrompt.characters[0]?.voice;
    const config = {
      voice: voice,
      prompt: prompt,
    };

    const roomName = `training_${module.trainingId}_module_${module.ordinal}`;

    // Create room with metadata
    const roomClient = new RoomServiceClient(
      LIVEKIT_URL!,
      API_KEY!,
      API_SECRET!
    );
    await roomClient.createRoom({
      name: roomName,
      metadata: JSON.stringify({ config }),
    });

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
      },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createPrompt(modulePrompt: ModulePrompt) {
  let rolePlayInstruction =
    "You are a role-playing agent. You will be given a scenario. You should act as the character you are assigned to and play out the scenario as the best actor you can be. You should not deviate from the scenario.";

  const yourName =
    modulePrompt.characters.length > 0
      ? `Your name is ${modulePrompt.characters[0].name}.`
      : "";
  const yourCharacter =
    modulePrompt.characters.length > 0
      ? `Your character, traits are decribed as follows and you should act as them: ${modulePrompt.characters[0].prompt}.`
      : "";
  const prompt = `
  Instructions: 
  ${rolePlayInstruction}
  Information about you:
  ${yourName} 
  -------
  ${yourCharacter}
  Scenario:
  ${modulePrompt.scenario}
  `;

  return prompt;
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = "5m";
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
