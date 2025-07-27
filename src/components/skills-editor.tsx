"use client";

import { Skills } from "@/types/character-attributes";
import { BrandedSlider } from "@/components/ui/branded-slider";
import { Label } from "@/components/ui/label";

type SkillsEditorProps = {
  skills: Skills;
  onChange: (skills: Skills) => void;
  disabled?: boolean;
};

export function SkillsEditor({ skills, onChange, disabled = false }: SkillsEditorProps) {
  const handleSkillChange = (skillKey: keyof Skills, value: number[]) => {
    const normalizedValue = value[0] / 100; // Convert from 0-100 to 0-1
    onChange({
      ...skills,
      [skillKey]: normalizedValue,
    });
  };

  const skillLabels: Record<keyof Skills, { label: string; description: string }> = {
    EQ: {
      label: "Emotional Intelligence",
      description: "Understanding and managing emotions in interactions"
    },
    Clarity: {
      label: "Conceptual Clarity", 
      description: "Clear communication of complex ideas and concepts"
    },
    Strategy: {
      label: "Strategic Framing",
      description: "Ability to frame discussions within strategic context"
    },
    Negotiation: {
      label: "Collaborative Negotiation",
      description: "Finding win-win solutions through collaborative approaches"
    },
    Facilitation: {
      label: "Directive Facilitation",
      description: "Guiding conversations and meetings toward productive outcomes"
    },
  };

  const getSkillLevelColor = (value: number) => {
    if (value >= 75) return "text-brand";
    if (value >= 50) return "text-teal-600 dark:text-teal-400";
    if (value >= 25) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const getSkillLevelBg = (value: number) => {
    if (value >= 75) return "bg-brand/10 border-brand/20";
    if (value >= 50) return "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800";
    if (value >= 25) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    return "bg-secondary/30 border-border/30";
  };

  return (
    <div className="space-y-5">
      {Object.entries(skillLabels).map(([skillKey, { label, description }]) => {
        const value = Math.round(skills[skillKey as keyof Skills] * 100); // Convert 0-1 to 0-100
        
        return (
          <div key={skillKey} className={`p-4 rounded-lg border transition-all ${getSkillLevelBg(value)}`}>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor={skillKey} className="text-sm font-semibold">
                {label}
              </Label>
              <span className={`text-sm font-mono font-medium px-2 py-1 rounded-md bg-background/50 ${getSkillLevelColor(value)}`}>
                {value}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {description}
            </p>
            <div className="relative">
              <BrandedSlider
                id={skillKey}
                value={[value]}
                onValueChange={(value) => handleSkillChange(skillKey as keyof Skills, value)}
                max={100}
                min={0}
                step={5}
                disabled={disabled}
                color={value >= 75 ? "brand" : value >= 50 ? "teal" : value >= 25 ? "amber" : "slate"}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Minimal</span>
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}