"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useEffect,
  useState,
} from "react";
import { useChat, UIMessage } from "@ai-sdk/react";
import { useApiKey } from "@/hooks/use-api-key";
import { logger } from "@/lib/logger";
import { DefaultChatTransport, ChatStatus } from "ai";


export type ContextType = "module" | "character" | "training";

export type ContextData = {
  trainingId?: string;
  moduleId?: string;
  characterId?: string;
};

// For passing selected option information to the API
export type SelectedOption = {
  id: string;
  label: string;
  targetField: string;
  targetTab?: string;
};

// Field focus tracking for automatically selecting options
export type FocusedField = {
  fieldType: string;
};

type SubmitHandler = (
  e: React.FormEvent<HTMLFormElement>,
  additionalData?: Record<string, unknown>
) => void;

type AIPaneContextType = {
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: SubmitHandler;
  status: ChatStatus;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  contextType?: ContextType;
  contextData?: ContextData;
  applyGeneratedContent?: (content: string, targetField: string) => void;
  onTabSwitch?: (tabName: string) => void;
  focusedField?: FocusedField;
  setFocusedField: (field: FocusedField | undefined) => void;
  clearMessages: () => void;
  selectedOption?: SelectedOption;
  setSelectedOption: (option: SelectedOption | undefined) => void;
  error?: Error;
  showNoCreditsDialog: boolean;
  setShowNoCreditsDialog: (show: boolean) => void;
};

const AIPaneContext = createContext<AIPaneContextType | undefined>(undefined);

interface AIPaneProviderProps {
  children: ReactNode;
  contextType?: ContextType;
  contextData?: ContextData;
  onApplyContent?: (content: string, targetField: string) => void;
  onTabSwitch?: (tabName: string) => void;
  focusedField?: FocusedField;
}

export function AIPaneProvider({
  children,
  contextType,
  contextData,
  onApplyContent,
  onTabSwitch,
  focusedField: externalFocusedField,
}: AIPaneProviderProps) {
  const { apiKey } = useApiKey();
  const [input, setInput] = useState("");
  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        contextType,
        contextData,
        apiKey
      }
    }),
    onError: (error) => {
      logger.error("AI Pane chat error:", error);

      // Check if it's a credit error
      const errorMessage = error.message || String(error);
      if (
        errorMessage.includes("No credits available") ||
        errorMessage.includes("402")
      ) {
        logger.info(
          "Credit error detected in AI Pane, showing NoCreditsDialog"
        );
        setShowNoCreditsDialog(true);
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [internalFocusedField, setInternalFocusedField] = useState<
    FocusedField | undefined
  >(undefined);
  const [selectedOption, setSelectedOption] = useState<
    SelectedOption | undefined
  >(undefined);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  // Use external focused field if provided, otherwise use internal state
  const focusedField = externalFocusedField || internalFocusedField;

  // Custom submit handler that can include additional data
  const handleSubmit: SubmitHandler = (e, additionalData = {}) => {
    e.preventDefault();
    
    const messageContent = input.trim() || " ";
    
    sendMessage(
      { text: messageContent },
      {
        body: {
          ...additionalData,
          contextType,
          contextData,
          selectedOption,
          apiKey,
        },
      }
    );
    
    // Clear input after sending
    setInput("");
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

  // Function to clear all messages and start a fresh chat
  const clearMessages = () => {
    setMessages([]);
    setInput("");
  };

  // Create context value
  const value: AIPaneContextType = {
    messages,
    input,
    setInput,
    handleSubmit,
    status,
    messagesEndRef,
    contextType,
    contextData,
    applyGeneratedContent,
    onTabSwitch,
    focusedField,
    setFocusedField: setInternalFocusedField,
    clearMessages,
    selectedOption,
    setSelectedOption,
    error,
    showNoCreditsDialog,
    setShowNoCreditsDialog,
  };

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
