"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PricingFeature {
  text: string
}

interface PricingTier {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: PricingFeature[]
  isPopular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: "BASIC",
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: "Perfect for individuals and small projects",
    features: [
      { text: "1 User" },
      { text: "5GB Storage" },
      { text: "Basic Support" },
      { text: "Limited API Access" },
      { text: "Standard Analytics" },
    ],
  },
  {
    name: "PRO",
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: "Ideal for growing businesses and teams",
    features: [
      { text: "5 Users" },
      { text: "50GB Storage" },
      { text: "Priority Support" },
      { text: "Full API Access" },
      { text: "Advanced Analytics" },
    ],
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "For large-scale operations and high-volume users",
    features: [
      { text: "Unlimited Users" },
      { text: "500GB Storage" },
      { text: "24/7 Premium Support" },
      { text: "Custom Integrations" },
      { text: "AI-Powered Insights" },
    ],
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-red-500 font-medium mb-4">PRICING</div>
          <h2 className="text-4xl font-bold mb-16">Choose the plan that's right for you</h2>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>Yearly</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card key={tier.name} className={`relative ${tier.isPopular ? "border-red-500 shadow-lg" : ""}`}>
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  Popular
                </div>
              )}
              <CardHeader>
                <h3 className="text-lg font-semibold text-center mb-4">{tier.name}</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold">${isYearly ? tier.yearlyPrice : tier.monthlyPrice}</div>
                  <div className="text-sm text-muted-foreground">/ {isYearly ? "year" : "month"}</div>
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
                  className={`w-full ${tier.isPopular ? "bg-red-500 hover:bg-red-600" : ""}`}
                  variant={tier.isPopular ? "default" : "outline"}
                >
                  Subscribe
                </Button>
                <p className="text-xs text-center text-muted-foreground">{tier.description}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

