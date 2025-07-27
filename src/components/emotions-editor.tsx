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

  const emotionLabels: Record<keyof Emotions, { label: string; description: string }> = {
    Neutral: {
      label: "Neutral",
      description: "Balanced, objective emotional state without strong reactions"
    },
    Supportive: {
      label: "Supportive", 
      description: "Encouraging, helpful, and understanding demeanor"
    },
    Enthusiastic: {
      label: "Enthusiastic",
      description: "High energy, positive, and excited engagement"
    },
    Concerned: {
      label: "Concerned",
      description: "Thoughtful worry or care about outcomes and details"
    },
    Frustrated: {
      label: "Frustrated",
      description: "Impatience or annoyance when things don't go as expected"
    },
  };

  const getEmotionColor = (emotionKey: string, value: number) => {
    if (value < 25) return "text-muted-foreground";
    
    switch (emotionKey) {
      case "Neutral":
        return "text-slate-600 dark:text-slate-400";
      case "Supportive":
        return "text-emerald-600 dark:text-emerald-400";
      case "Enthusiastic":
        return "text-brand";
      case "Concerned":
        return "text-amber-600 dark:text-amber-400";
      case "Frustrated":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getEmotionBg = (emotionKey: string, value: number) => {
    if (value < 25) return "bg-secondary/30 border-border/30";
    
    switch (emotionKey) {
      case "Neutral":
        return "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800";
      case "Supportive":
        return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
      case "Enthusiastic":
        return "bg-brand/10 border-brand/20";
      case "Concerned":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
      case "Frustrated":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      default:
        return "bg-secondary/30 border-border/30";
    }
  };

  const getEmotionSliderColor = (emotionKey: string, value: number): "brand" | "emerald" | "amber" | "red" | "slate" => {
    if (value < 25) return "slate";
    
    switch (emotionKey) {
      case "Neutral":
        return "slate";
      case "Supportive":
        return "emerald";
      case "Enthusiastic":
        return "brand";
      case "Concerned":
        return "amber";
      case "Frustrated":
        return "red";
      default:
        return "brand";
    }
  };

  return (
    <div className="space-y-5">
      {Object.entries(emotionLabels).map(([emotionKey, { label, description }]) => {
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
                <span>Mild</span>
                <span>Moderate</span>
                <span>Strong</span>
                <span>Very Strong</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}