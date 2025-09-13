"use client";

import { Traits } from "@/types/character-attributes";
import { BrandedSlider } from "@/components/ui/branded-slider";
import { Label } from "@/components/ui/label";

type TraitsEditorProps = {
  traits: Traits;
  onChange: (traits: Traits) => void;
  disabled?: boolean;
};

export function TraitsEditor({ traits, onChange, disabled = false }: TraitsEditorProps) {
  const handleTraitChange = (traitKey: keyof Traits, value: number[]) => {
    onChange({
      ...traits,
      [traitKey]: value[0], // Work directly with 0-100 values
    });
  };

  const traitLabels: Record<
    keyof Traits,
    { label: string; description: string; lowLabel: string; highLabel: string }
  > = {
    Outlook: {
      label: "Outlook",
      description: "Critical/negative vs Optimistic/positive",
      lowLabel: "Critical",
      highLabel: "Optimistic",
    },
    Energy: {
      label: "Energy",
      description: "Calm/measured vs Animated/lively",
      lowLabel: "Calm",
      highLabel: "Animated",
    },
    Control: {
      label: "Control",
      description: "Yielding/deferential vs Assertive/directive",
      lowLabel: "Yielding",
      highLabel: "Assertive",
    },
    Confidence: {
      label: "Confidence",
      description: "Tentative/exploratory vs Decisive/sure",
      lowLabel: "Tentative",
      highLabel: "Decisive",
    },
    Warmth: {
      label: "Warmth",
      description: "Task-focused/detached vs People-focused/friendly",
      lowLabel: "Task-focused",
      highLabel: "People-focused",
    },
  };

  const getTraitColor = (traitKey: string, value: number) => {
    if (value < 25) return "text-muted-foreground";
    
    switch (traitKey) {
      case "Outlook":
        return "text-emerald-600 dark:text-emerald-400";
      case "Energy":
        return "text-brand";
      case "Control":
        return "text-purple-600 dark:text-purple-400";
      case "Confidence":
        return "text-blue-600 dark:text-blue-400";
      case "Warmth":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getTraitBg = (traitKey: string, value: number) => {
    if (value < 25) return "bg-secondary/30 border-border/30";
    
    switch (traitKey) {
      case "Outlook":
        return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
      case "Energy":
        return "bg-brand/10 border-brand/20";
      case "Control":
        return "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800";
      case "Confidence":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
      case "Warmth":
        return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
      default:
        return "bg-secondary/30 border-border/30";
    }
  };

  const getTraitSliderColor = (traitKey: string, value: number): "brand" | "emerald" | "amber" | "red" | "slate" => {
    if (value < 25) return "slate";
    
    switch (traitKey) {
      case "Outlook":
        return "emerald";
      case "Energy":
        return "brand";
      case "Control":
        return "slate"; // Using slate for purple since we don't have purple variant
      case "Confidence":
        return "slate"; // Using slate for blue since we don't have blue variant
      case "Warmth":
        return "amber"; // Using amber for orange since we don't have orange variant
      default:
        return "brand";
    }
  };

  return (
    <div className="space-y-5">
      {Object.entries(traitLabels).map(([traitKey, { label, description, lowLabel, highLabel }]) => {
        const value = traits[traitKey as keyof Traits]; // Already 0-100
        
        return (
          <div key={traitKey} className={`p-4 rounded-lg border transition-all ${getTraitBg(traitKey, value)}`}>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor={traitKey} className="text-sm font-semibold">
                {label}
              </Label>
              <span className={`text-sm font-mono font-medium px-2 py-1 rounded-md bg-background/50 ${getTraitColor(traitKey, value)}`}>
                {value}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {description}
            </p>
            <div className="relative">
              <BrandedSlider
                id={traitKey}
                value={[value]}
                onValueChange={(value) => handleTraitChange(traitKey as keyof Traits, value)}
                max={100}
                min={0}
                step={5}
                disabled={disabled}
                color={getTraitSliderColor(traitKey, value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{lowLabel}</span>
                <span>Balanced</span>
                <span>{highLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}