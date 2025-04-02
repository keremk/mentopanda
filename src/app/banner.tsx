// app/banner.js
"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";

export function cookieConsentGiven() {
  if (!localStorage.getItem("cookie_consent")) {
    return "undecided";
  }
  return localStorage.getItem("cookie_consent");
}

export function Banner() {
  const [consentGiven, setConsentGiven] = useState<string | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    // We want this to only run once the client loads
    // or else it causes a hydration error
    setConsentGiven(cookieConsentGiven());
  }, []);

  useEffect(() => {
    if (consentGiven !== "") {
      posthog.set_config({
        persistence: consentGiven === "yes" ? "localStorage+cookie" : "memory",
      });
    }
  }, [consentGiven]);

  const handleAcceptCookies = () => {
    localStorage.setItem("cookie_consent", "yes");
    setConsentGiven("yes");
  };

  const handleDeclineCookies = () => {
    localStorage.setItem("cookie_consent", "no");
    setConsentGiven("no");
  };

  return (
    <div>
      {(consentGiven === "undecided") && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 p-4",
            "bg-background border-t border-border shadow-lg",
            "animate-in slide-in-from-bottom-5 duration-300 ease-in-out"
          )}
        >
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  We use tracking cookies to understand how you use the product
                  and help us improve it. Please accept cookies to help us
                  improve.
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={handleDeclineCookies}
                >
                  Decline cookies
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-sm"
                  onClick={handleAcceptCookies}
                >
                  Accept cookies
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
