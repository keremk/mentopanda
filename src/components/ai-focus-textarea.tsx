"use client";

import { useRef, useState, useEffect } from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { useAIPane } from "@/contexts/ai-pane-context";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

export function AIFocusTextarea({
  name,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const { setFocusedField } = useAIPane();
  const [hasFocus, setHasFocus] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<string | undefined>(
    undefined
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLTextAreaElement>(null);

  // Measure height on value/className change
  useEffect(() => {
    if (measureRef.current) {
      setMeasuredHeight(`${measureRef.current.offsetHeight}px`);
    }
  }, [value, props.className]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setHasFocus(true);
    if (name) {
      setFocusedField({ fieldType: name });
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Measure the height before hiding
    if (textareaRef.current) {
      setMeasuredHeight(`${textareaRef.current.offsetHeight}px`);
    }
    setHasFocus(false);
    setFocusedField(undefined);
    props.onBlur?.(e);
  };

  useEffect(() => {
    if (hasFocus && shouldFocus && textareaRef.current) {
      textareaRef.current.focus();
      setShouldFocus(false);
    }
  }, [hasFocus, shouldFocus]);

  // Always render a hidden textarea for measurement
  const hiddenTextarea = (
    <textarea
      ref={measureRef}
      value={value}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
      style={{
        visibility: "hidden",
        position: "absolute",
        left: 0,
        top: 0,
        height: "auto",
        pointerEvents: "none",
        zIndex: -1,
        width: "100%",
        // Match all relevant classes
      }}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground ${props.className || ""}`}
      rows={props.rows}
    />
  );

  if (hasFocus) {
    return (
      <>
        <Textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
          className={`${props.className || ""} ring-1 ring-brand/30 transition-all duration-200`}
        />
        {hiddenTextarea}
      </>
    );
  }

  // Not focused, show rendered markdown (fallback to empty string if value undefined)
  return (
    <>
      <div
        onClick={() => {
          setHasFocus(true);
          setShouldFocus(true);
        }}
        tabIndex={0}
        style={{
          cursor: "pointer",
          height: measuredHeight,
          minHeight: measuredHeight,
          maxHeight: measuredHeight,
        }}
        className={`w-full rounded-xxl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground overflow-auto ${props.className || ""}`}
      >
        <MemoizedMarkdown content={typeof value === "string" ? value : ""} />
      </div>
      {hiddenTextarea}
    </>
  );
}
