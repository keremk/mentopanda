"use client";

import { useRef, useState } from "react";
import { Input, InputProps } from "@/components/ui/input";
import { useAIPane } from "@/contexts/ai-pane-context";

export function AIFocusInput({ name, ...props }: InputProps) {
  const { setFocusedField } = useAIPane();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setHasFocus(true);
    if (name) {
      setFocusedField({ fieldType: name });
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setHasFocus(false);
    setFocusedField(undefined);
    props.onBlur?.(e);
  };

  return (
    <Input
      ref={inputRef}
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
