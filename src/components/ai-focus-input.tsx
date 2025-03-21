"use client";

import { useRef, useState } from "react";
import { Input, InputProps } from "@/components/ui/input";
import { useAIPane } from "@/contexts/ai-pane-context";

interface AIFocusInputProps extends InputProps {
  fieldId: string;
  fieldType: string;
}

export function AIFocusInput({
  fieldId,
  fieldType,
  ...props
}: AIFocusInputProps) {
  const { setFocusedField } = useAIPane();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setHasFocus(true);
    setFocusedField({ fieldId, fieldType });
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
      {...props}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`${props.className || ""} ${
        hasFocus ? "ring-1 ring-brand/30" : ""
      }`}
    />
  );
}
