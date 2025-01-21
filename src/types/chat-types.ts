export type RolePlayer = {
  name: string;
  agentName: string;
  avatarUrl: string;
};

export type TranscriptEntry = {
  participantName: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
  createdAtMs: number;
};