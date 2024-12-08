export type ChatMessage = {
  content: string;
  sender: Participant["name"];
  timestamp: number;
};

export type Participant = {
  name: string;
  role: "human" | "agent";
  avatarUrl: string;
};
