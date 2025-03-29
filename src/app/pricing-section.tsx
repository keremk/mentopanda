"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    description: "COMING SOON: Ideal for growing businesses and teams",
    features: [
      { text: "Everything in FREE" },
      { text: "No need for API Key" },
      { text: "Manage team members" },
      { text: "Manage multiple projects" },
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
      { text: "Custom lesson development for your needs" },
      { text: "Premium Support" },
    ],
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  // Find the index of the popular (PRO) plan to set as initial
  const popularPlanIndex = pricingTiers.findIndex((tier) => tier.isPopular);

  return (
    <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <div className="text-brand font-medium mb-4">PRICING</div>
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
            <PricingCard
              key={tier.name}
              tier={tier}
              isYearly={isYearly}
              disabled={tier.name === "PRO"}
            />
          ))}
        </div>

        {/* Mobile Layout with Carousel */}
        <div className="relative md:hidden">
          <Carousel
            opts={{
              align: "center",
              loop: true,
              startIndex: popularPlanIndex !== -1 ? popularPlanIndex : 1,
            }}
            className="w-full mx-auto"
          >
            <CarouselContent>
              {pricingTiers.map((tier) => (
                <CarouselItem
                  key={tier.name}
                  className="basis-[85%] sm:basis-4/5 pl-4"
                >
                  <div>
                    <PricingCard
                      tier={tier}
                      isYearly={isYearly}
                      disabled={tier.name === "PRO"}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-6">
              <CarouselPrevious
                className="relative inline-flex h-10 w-10 bg-background border-muted-foreground/20"
                variant="outline"
              />
              <CarouselNext
                className="relative inline-flex h-10 w-10 bg-background border-muted-foreground/20"
                variant="outline"
              />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

// Extract PricingCard as a subcomponent
function PricingCard({
  tier,
  isYearly,
  disabled = false,
}: {
  tier: PricingTier;
  isYearly: boolean;
  disabled?: boolean;
}) {
  return (
    <Card
      className={`relative mt-6 transition-all duration-300 hover:shadow-lg ${
        tier.isPopular ? "border-brand shadow-lg" : ""
      }`}
    >
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground px-3 py-1 rounded-full text-sm">
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
            <Check className="w-4 h-4 text-brand" />
            <span className="text-sm">{feature.text}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          className={`w-full ${
            tier.isPopular
              ? "bg-brand hover:bg-brand-hover text-brand-foreground"
              : ""
          }`}
          variant={tier.isPopular ? "default" : "outline"}
          disabled={disabled}
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
