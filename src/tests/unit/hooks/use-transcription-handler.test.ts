import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTranscriptionHandler } from "@/hooks/use-transcription-handler";
import { Room, RoomEvent, ParticipantKind } from "livekit-client";

// Mock Room class
class MockRoom {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(...args));
  }
}

describe("useTranscriptionHandler", () => {
  let mockRoom: MockRoom;

  beforeEach(() => {
    mockRoom = new MockRoom();
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    expect(result.current.transcriptBuffer).toEqual([]);
    expect(result.current.currentAgentText).toBe("");
  });

  it("should handle agent non-final transcription", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "Hello",
            final: false,
            firstReceivedTime: 123,
          },
        ],
        {
          kind: ParticipantKind.AGENT,
          identity: "agent-1",
        }
      );
    });

    expect(result.current.currentAgentText).toBe("Hello");
    expect(result.current.transcriptBuffer).toHaveLength(0);
  });

  it("should handle agent final transcription", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "Hello",
            final: true,
            firstReceivedTime: 123,
          },
        ],
        {
          kind: ParticipantKind.AGENT,
          identity: "agent-1",
        }
      );
    });

    expect(result.current.currentAgentText).toBe("");
    expect(result.current.transcriptBuffer).toHaveLength(1);
    expect(result.current.transcriptBuffer[0]).toEqual({
      participantName: "agent-1",
      text: "Hello",
      timestamp: 123,
    });
  });

  it("should handle non-agent final transcription", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "User message",
            final: true,
            firstReceivedTime: 123,
          },
        ],
        {
          kind: ParticipantKind.STANDARD,
          identity: "user-1",
        }
      );
    });

    expect(result.current.currentAgentText).toBe("");
    expect(result.current.transcriptBuffer).toHaveLength(1);
    expect(result.current.transcriptBuffer[0]).toEqual({
      participantName: "user-1",
      text: "User message",
      timestamp: 123,
    });
  });

  it("should ignore non-agent non-final transcription", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "User typing...",
            final: false,
            firstReceivedTime: 123,
          },
        ],
        {
          kind: ParticipantKind.STANDARD,
          identity: "user-1",
        }
      );
    });

    expect(result.current.currentAgentText).toBe("");
    expect(result.current.transcriptBuffer).toHaveLength(0);
  });

  it("should handle multiple transcription segments", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "Hello",
            final: true,
            firstReceivedTime: 123,
          },
          {
            text: "World",
            final: true,
            firstReceivedTime: 124,
          },
        ],
        {
          kind: ParticipantKind.AGENT,
          identity: "agent-1",
        }
      );
    });

    expect(result.current.currentAgentText).toBe("");
    expect(result.current.transcriptBuffer).toHaveLength(2);
    expect(result.current.transcriptBuffer).toEqual([
      {
        participantName: "agent-1",
        text: "Hello",
        timestamp: 123,
      },
      {
        participantName: "agent-1",
        text: "World",
        timestamp: 124,
      },
    ]);
  });

  it("should handle missing participant identity", () => {
    const { result } = renderHook(() =>
      useTranscriptionHandler(mockRoom as unknown as Room)
    );

    act(() => {
      mockRoom.emit(
        RoomEvent.TranscriptionReceived,
        [
          {
            text: "Hello",
            final: true,
            firstReceivedTime: 123,
          },
        ],
        {
          kind: ParticipantKind.AGENT,
        }
      );
    });

    expect(result.current.transcriptBuffer[0].participantName).toBe("Unknown");
  });
});
