import React from "react";
import { CardContent } from "@/components/ui/card";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ChatBoxProps = {
  messages: ChatMessageProps[];
};

export const ChatBox = React.memo(({ messages }: ChatBoxProps) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  React.useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <CardContent className="h-64 overflow-y-auto p-4" ref={parentRef}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ChatMessage {...messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </CardContent>
  );
});

ChatBox.displayName = "ChatBox";

export type ChatMessageProps = {
  message: string;
  sender: {
    name: string;
    avatar: string;
  };
  isCurrentUser: boolean;
};

export function ChatMessage({
  message,
  sender,
  isCurrentUser,
}: ChatMessageProps) {
  return (
    <div
      className={`flex items-start space-x-2 ${
        isCurrentUser ? "justify-end" : ""
      }`}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback>{sender.name[0]}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`rounded-lg p-2 ${
          isCurrentUser ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        <p className="text-sm">{message}</p>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback>{sender.name[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
