import { ReactNode } from "react";

interface FeatureCardsProps {
  children: ReactNode;
}

export function FeatureCards({ children }: FeatureCardsProps) {
  return (
    <div className="feature-cards">
      {children}
    </div>
  );
}