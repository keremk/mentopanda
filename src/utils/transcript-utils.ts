import { TranscriptEntry } from "@/types/chat-types";

// Types matching the OpenAI Realtime API structure
type RealtimeContentItem =
  | { text: string; type: "input_text" }
  | { text: string; type: "text" }
  | { transcript: string | null; type: "input_audio" }
  | { audio?: string | null; transcript?: string | null; type: "audio" };

type RealtimeMessageItem = {
  itemId: string;
  previousItemId?: string | null;
  type: "message";
  role: "user" | "assistant" | "system";
  content: RealtimeContentItem[];
  status?: "in_progress" | "completed" | "incomplete";
};


/**
 * Converts OpenAI's session.history to clean TranscriptEntry format
 * Filters out any incomplete transcriptions and placeholder text
 */
export function convertHistoryToTranscript(
  history: unknown[]
): TranscriptEntry[] {
  const cleanEntries: TranscriptEntry[] = [];

  history.forEach((item) => {
    // Only process message items
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "message") {
      return;
    }

    const messageItem = item as RealtimeMessageItem;
    
    // Skip incomplete items
    if (messageItem.status === "in_progress") {
      return;
    }

    // Extract text from content
    let text = "";
    if (Array.isArray(messageItem.content)) {
      messageItem.content.forEach((contentItem) => {
        if (contentItem.type === "input_text" && "text" in contentItem) {
          text += contentItem.text;
        } else if (
          contentItem.type === "input_audio" &&
          "transcript" in contentItem &&
          contentItem.transcript
        ) {
          text += contentItem.transcript;
        } else if (contentItem.type === "text" && "text" in contentItem) {
          text += contentItem.text;
        } else if (
          contentItem.type === "audio" &&
          "transcript" in contentItem &&
          contentItem.transcript
        ) {
          text += contentItem.transcript;
        }
      });
    }

    // Skip entries with no meaningful text or placeholder text
    const trimmedText = text.trim();
    if (
      !trimmedText ||
      trimmedText === "[Transcribing...]" ||
      trimmedText === "[Generating...]"
    ) {
      return;
    }

    // Determine participant name
    const participantName = messageItem.role === "user" ? "You" : "AI";

    // Create transcript entry
    const entry: TranscriptEntry = {
      id: messageItem.itemId,
      participantName,
      role: messageItem.role === "assistant" ? "agent" : messageItem.role === "system" ? "agent" : "user",
      text: trimmedText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAtMs: Date.now(),
      status: "DONE",
      isHidden: false,
    };

    cleanEntries.push(entry);
  });

  // Sort by creation order (itemId or use array order)
  return cleanEntries;
}

/**
 * Formats transcript entries to plain text
 */
export function formatTranscriptToText(entries: TranscriptEntry[]): string {
  return entries
    .map((entry) => `${entry.participantName}: ${entry.text}`)
    .join("\n");
}