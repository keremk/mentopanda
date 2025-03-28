"use client";

import { useRef, useState } from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { useAIPane } from "@/contexts/ai-pane-context";

export function AIFocusTextarea({ name, ...props }: TextareaProps) {
  const { setFocusedField } = useAIPane();
  const [hasFocus, setHasFocus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setHasFocus(true);
    if (name) {
      setFocusedField({ fieldType: name });
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setHasFocus(false);
    setFocusedField(undefined);
    props.onBlur?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      name={name}
      {...props}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`${props.className || ""} ${
        hasFocus ? "ring-1 ring-brand/30" : ""
      }`}
    />
  );
}
