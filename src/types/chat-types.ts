export type RolePlayer = {
  name: string;
  agentName: string;
  avatarUrl?: string;
};

export type TranscriptEntry = {
  id: string;
  participantName: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
  createdAtMs: number;
  status: "IN_PROGRESS" | "DONE";
  isHidden: boolean;
};
