"use client";

import { createContext, useContext, ReactNode, useRef, useEffect } from "react";
import { useChat, Message } from "@ai-sdk/react";

type InputHandler = (
  e:
    | React.ChangeEvent<HTMLTextAreaElement>
    | React.ChangeEvent<HTMLInputElement>
) => void;

type SubmitHandler = (e: React.FormEvent<HTMLFormElement>) => void;

interface AIPaneContextType {
  messages: Message[];
  input: string;
  handleInputChange: InputHandler;
  handleSubmit: SubmitHandler;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const AIPaneContext = createContext<AIPaneContextType | undefined>(undefined);

export function AIPaneProvider({ children }: { children: ReactNode }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Create context value with type assertion
  const value = {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    messagesEndRef,
  } as AIPaneContextType;

  return (
    <AIPaneContext.Provider value={value}>{children}</AIPaneContext.Provider>
  );
}

export function useAIPane() {
  const context = useContext(AIPaneContext);
  if (context === undefined) {
    throw new Error("useAIPane must be used within an AIPaneProvider");
  }
  return context;
}
