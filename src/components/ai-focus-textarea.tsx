"use client";

import { useRef, useEffect } from "react";
import { TextareaProps } from "@/components/ui/textarea";
import { useAIPane } from "@/contexts/ai-pane-context";
import { useTheme } from "next-themes";

// Import OverType from the installed package
// @ts-expect-error - OverType doesn't have TypeScript definitions
import OverType from "overtype";

export function AIFocusTextarea({
  name,
  value,
  onChange,
  placeholder,
  className,
  onFocus,
  onBlur,
}: TextareaProps) {
  const { setFocusedField } = useAIPane();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<unknown>(null);
  
  // Store latest prop values in refs so event handlers can access them
  const propsRef = useRef({ name, onChange, onFocus, onBlur, setFocusedField });
  propsRef.current = { name, onChange, onFocus, onBlur, setFocusedField };

  // Initialize/recreate OverType editor when theme changes
  useEffect(() => {
    if (!containerRef.current || !resolvedTheme) return;

    // Destroy existing instance if it exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (editorInstanceRef.current && (editorInstanceRef.current as any)?.destroy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editorInstanceRef.current as any).destroy();
    }

    // Use next-themes resolved theme
    const overtypeTheme = resolvedTheme === 'dark' ? 'cave' : 'solar';
    
    const [instance] = OverType.init(containerRef.current, {
      value: typeof value === "string" ? value : "",
      theme: overtypeTheme,
      toolbar: false,
      placeholder: placeholder || "Enter text here...",
      autoResize: false,
      minHeight: '200px',
      maxHeight: null, // Allow unlimited height
      onChange: (newValue: string) => {
        const props = propsRef.current;
        if (props.onChange) {
          const syntheticEvent = {
            target: { name: props.name, value: newValue },
            currentTarget: { name: props.name, value: newValue }
          } as React.ChangeEvent<HTMLTextAreaElement>;
          props.onChange(syntheticEvent);
        }
      },
      onFocus: () => {
        const props = propsRef.current;
        if (props.name) {
          props.setFocusedField({ fieldType: props.name });
        }
        if (props.onFocus) {
          const syntheticEvent = {} as React.FocusEvent<HTMLTextAreaElement>;
          props.onFocus(syntheticEvent);
        }
      },
      onBlur: () => {
        const props = propsRef.current;
        props.setFocusedField(undefined);
        if (props.onBlur) {
          const syntheticEvent = {} as React.FocusEvent<HTMLTextAreaElement>;
          props.onBlur(syntheticEvent);
        }
      },
    });
    
    editorInstanceRef.current = instance;

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (editorInstanceRef.current && (editorInstanceRef.current as any)?.destroy) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editorInstanceRef.current as any).destroy();
      }
    };
  }, [resolvedTheme]); // Recreate when theme changes

  // Handle value updates without destroying instance
  useEffect(() => {
    if (editorInstanceRef.current && value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentValue = (editorInstanceRef.current as any)?.getValue();
      if (currentValue !== value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editorInstanceRef.current as any)?.setValue(typeof value === "string" ? value : "");
      }
    }
  }, [value]);

  return (
    <div 
      ref={containerRef}
      className={`ai-focus-overtype w-full h-full rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-brand/30 transition-all duration-200 ${className || ""}`}
    />
  );
}
