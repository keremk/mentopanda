"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingFeature {
  text: string;
}

interface PricingTier {
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  description: string;
  features: PricingFeature[];
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "FREE",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Pay OpenAI directly for your usage",
    features: [
      { text: "Bring your own API Key" },
      { text: "Create and customize your own lessons, characters" },
      { text: "2 Starter Lessons" },
      { text: "Community Support" },
    ],
  },
  {
    name: "PRO",
    monthlyPrice: 20,
    yearlyPrice: 16,
    description: "Ideal for growing businesses and teams",
    features: [
      { text: "50 hours of lessons per month" },
      { text: "5 Premium Lessons" },
      { text: "Create and customize your own lessons, characters" },
      { text: "Email Support" },
    ],
    isPopular: true,
  },
  {
    name: "CUSTOM",
    monthlyPrice: null,
    yearlyPrice: null,
    description: "For your custom needs",
    features: [
      { text: "100 hours of lessons per month" },
      { text: "Custom lesson development for your needs" },
      { text: "Premium Support" },
    ],
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1); // Start with PRO card

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Center on PRO card initially
    const scrollToCenter = () => {
      const cardWidth = container.clientWidth * 0.7;
      container.scrollLeft = cardWidth;
    };

    scrollToCenter();
    window.addEventListener("resize", scrollToCenter);

    let lastScrollLeft = container.scrollLeft;

    const handleScroll = () => {
      const currentScrollLeft = container.scrollLeft;

      // Determine scroll direction
      if (currentScrollLeft > lastScrollLeft) {
        // Scrolling right
        setActiveIndex((prev) => Math.min(prev + 1, pricingTiers.length - 1));
      } else if (currentScrollLeft < lastScrollLeft) {
        // Scrolling left
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      lastScrollLeft = currentScrollLeft;
    };

    container.addEventListener("scrollend", handleScroll);
    return () => {
      window.removeEventListener("resize", scrollToCenter);
      container.removeEventListener("scrollend", handleScroll);
    };
  }, []);

  return (
    <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <div className="text-red-500 font-medium mb-4">PRICING</div>
          <h2 className="text-4xl font-bold mb-8">
            Choose the plan that is right for you
          </h2>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${
                !isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span
              className={`text-sm ${
                isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
            </span>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} isYearly={isYearly} />
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="relative md:hidden">
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{
                margin: "0 -20%",
                padding: "0 20%",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {pricingTiers.map((tier, index) => (
                <div
                  key={tier.name}
                  data-index={index}
                  className="w-[70%] flex-shrink-0 snap-center px-4"
                >
                  <div
                    className="transition-opacity duration-300"
                    style={{
                      opacity: activeIndex !== index ? 0.3 : 1,
                    }}
                  >
                    <PricingCard tier={tier} isYearly={isYearly} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Extract PricingCard as a subcomponent
function PricingCard({
  tier,
  isYearly,
}: {
  tier: PricingTier;
  isYearly: boolean;
}) {
  return (
    <Card
      className={`relative mt-6 ${
        tier.isPopular ? "border-red-500 shadow-lg" : ""
      }`}
    >
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
          Popular
        </div>
      )}
      <CardHeader>
        <h3 className="text-lg font-semibold text-center mb-4">{tier.name}</h3>
        <div className="text-center min-h-[80px] flex flex-col justify-center">
          {(isYearly ? tier.yearlyPrice : tier.monthlyPrice) !== null ? (
            <>
              <div className="text-4xl font-bold">
                ${isYearly ? tier.yearlyPrice : tier.monthlyPrice}
              </div>
              <div className="text-sm text-muted-foreground">
                / {isYearly ? "year" : "month"}
              </div>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tier.features.map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-red-500" />
            <span className="text-sm">{feature.text}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          className={`w-full ${
            tier.isPopular ? "bg-red-500 hover:bg-red-600" : ""
          }`}
          variant={tier.isPopular ? "default" : "outline"}
        >
          {(isYearly ? tier.yearlyPrice : tier.monthlyPrice) === null
            ? "Contact Us"
            : "Subscribe"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          {tier.description}
        </p>
      </CardFooter>
    </Card>
  );
}
