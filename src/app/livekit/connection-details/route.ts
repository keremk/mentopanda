import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
  RoomServiceClient,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getModuleById } from "@/data/modules";

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
    // Get moduleId and trainingId from query parameter
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    if (!moduleId) throw new Error("moduleId is required");

    const supabase = createClient();
    const module = await getModuleById(supabase, moduleId);
    if (!module) throw new Error("Module not found");
    const prompt = module.prompt;

    const roomName = "voice_assistant_room";

    // Create room with metadata
    const roomClient = new RoomServiceClient(
      LIVEKIT_URL!,
      API_KEY!,
      API_SECRET!
    );
    await roomClient.createRoom({
      name: roomName,
      metadata: JSON.stringify({ prompt }),
    });

    // Generate participant token
    const participantIdentity = `voice_assistant_user_${Math.round(
      Math.random() * 10_000
    )}`;
    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
      },
      roomName
    );

    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }

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
