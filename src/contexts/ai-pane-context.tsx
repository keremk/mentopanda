"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useEffect,
  useState,
} from "react";
import { useChat, Message } from "@ai-sdk/react";

export type ContextType =
  | "scenario"
  | "assessment"
  | "module"
  | "character"
  | "training"
  | undefined;

export interface ContextData {
  currentContent?: string;
  relatedContent?: Record<string, string | undefined>;
  [key: string]: string | Record<string, string | undefined> | undefined;
}

// For passing selected option information to the API
export interface SelectedOption {
  id: string;
  label: string;
  targetField: string;
}

// Field focus tracking for automatically selecting options
export interface FocusedField {
  fieldId: string;
  fieldType: string;
}

type InputHandler = (
  e:
    | React.ChangeEvent<HTMLTextAreaElement>
    | React.ChangeEvent<HTMLInputElement>
) => void;

type SubmitHandler = (
  e: React.FormEvent<HTMLFormElement>,
  additionalData?: Record<string, unknown>
) => void;

interface AIPaneContextType {
  messages: Message[];
  input: string;
  handleInputChange: InputHandler;
  handleSubmit: SubmitHandler;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  contextType?: ContextType;
  contextData?: ContextData;
  applyGeneratedContent?: (content: string, targetField: string) => void;
  focusedField?: FocusedField;
  setFocusedField: (field: FocusedField | undefined) => void;
}

const AIPaneContext = createContext<AIPaneContextType | undefined>(undefined);

interface AIPaneProviderProps {
  children: ReactNode;
  contextType?: ContextType;
  contextData?: ContextData;
  onApplyContent?: (content: string, targetField: string) => void;
  focusedField?: FocusedField;
}

export function AIPaneProvider({
  children,
  contextType,
  contextData,
  onApplyContent,
  focusedField: externalFocusedField,
}: AIPaneProviderProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: chatHandleSubmit,
    isLoading,
  } = useChat({
    api: "/api/chat",
    body: {
      contextType,
      contextData,
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [internalFocusedField, setInternalFocusedField] = useState<
    FocusedField | undefined
  >(undefined);

  // Use external focused field if provided, otherwise use internal state
  const focusedField = externalFocusedField || internalFocusedField;

  // Custom submit handler that can include additional data
  const handleSubmit: SubmitHandler = (e, additionalData = {}) => {
    chatHandleSubmit(e, {
      body: {
        ...additionalData,
        contextType,
        contextData,
      },
    });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handler for applying generated content to the target field
  const applyGeneratedContent = (content: string, targetField: string) => {
    if (onApplyContent) {
      onApplyContent(content, targetField);
    }
  };

  // Create context value with type assertion
  const value = {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    messagesEndRef,
    contextType,
    contextData,
    applyGeneratedContent,
    focusedField,
    setFocusedField: setInternalFocusedField,
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
