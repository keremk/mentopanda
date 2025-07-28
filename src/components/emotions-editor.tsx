"use client";

import { Emotions } from "@/types/character-attributes";
import { BrandedSlider } from "@/components/ui/branded-slider";
import { Label } from "@/components/ui/label";

type EmotionsEditorProps = {
  emotions: Emotions;
  onChange: (emotions: Emotions) => void;
  disabled?: boolean;
};

export function EmotionsEditor({ emotions, onChange, disabled = false }: EmotionsEditorProps) {
  const handleEmotionChange = (emotionKey: keyof Emotions, value: number[]) => {
    const normalizedValue = value[0] / 100; // Convert from 0-100 to 0-1
    onChange({
      ...emotions,
      [emotionKey]: normalizedValue,
    });
  };

  const emotionLabels: Record<keyof Emotions, { label: string; description: string; lowLabel: string; highLabel: string }> = {
    Pleasure: {
      label: "Pleasure",
      description: "Valence: Positive/optimistic vs negative/critical",
      lowLabel: "Critical",
      highLabel: "Optimistic"
    },
    Energy: {
      label: "Energy", 
      description: "Arousal: Lively/animated vs calm/measured",
      lowLabel: "Calm",
      highLabel: "Animated"
    },
    Control: {
      label: "Control",
      description: "Dominance: Assertive/directive vs deferential/yielding",
      lowLabel: "Yielding",
      highLabel: "Assertive"
    },
    Confidence: {
      label: "Confidence",
      description: "Certainty: Decisive/sure vs tentative/exploratory",
      lowLabel: "Tentative",
      highLabel: "Decisive"
    },
    Warmth: {
      label: "Warmth",
      description: "Affiliation: Person-focused/friendly vs task-only/detached",
      lowLabel: "Task-focused",
      highLabel: "People-focused"
    },
  };

  const getEmotionColor = (emotionKey: string, value: number) => {
    if (value < 25) return "text-muted-foreground";
    
    switch (emotionKey) {
      case "Pleasure":
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

  const getEmotionBg = (emotionKey: string, value: number) => {
    if (value < 25) return "bg-secondary/30 border-border/30";
    
    switch (emotionKey) {
      case "Pleasure":
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

  const getEmotionSliderColor = (emotionKey: string, value: number): "brand" | "emerald" | "amber" | "red" | "slate" => {
    if (value < 25) return "slate";
    
    switch (emotionKey) {
      case "Pleasure":
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
      {Object.entries(emotionLabels).map(([emotionKey, { label, description, lowLabel, highLabel }]) => {
        const value = Math.round(emotions[emotionKey as keyof Emotions] * 100); // Convert 0-1 to 0-100
        
        return (
          <div key={emotionKey} className={`p-4 rounded-lg border transition-all ${getEmotionBg(emotionKey, value)}`}>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor={emotionKey} className="text-sm font-semibold">
                {label}
              </Label>
              <span className={`text-sm font-mono font-medium px-2 py-1 rounded-md bg-background/50 ${getEmotionColor(emotionKey, value)}`}>
                {value}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {description}
            </p>
            <div className="relative">
              <BrandedSlider
                id={emotionKey}
                value={[value]}
                onValueChange={(value) => handleEmotionChange(emotionKey as keyof Emotions, value)}
                max={100}
                min={0}
                step={5}
                disabled={disabled}
                color={getEmotionSliderColor(emotionKey, value)}
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