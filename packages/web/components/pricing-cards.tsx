"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles, Star } from "lucide-react";
import { config } from "@/srm.config";
import { twMerge } from "tailwind-merge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  createPayOnceLifetimeCheckout,
  createMonthlySubscriptionCheckout,
  createYearlySubscriptionCheckout,
  createPayOnceOneYearCheckout,
} from "@/app/dashboard/pricing/actions";

interface PricingCardsProps {
  onSubscriptionComplete?: (type: 'lifetime' | 'cloud') => void;
}

export function PricingCards({ onSubscriptionComplete }: PricingCardsProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);

  const handlePlanSelection = async (planKey: string) => {
    try {
      let redirectUrl;
      
      switch (planKey) {
        case "Monthly":
          redirectUrl = await createMonthlySubscriptionCheckout();
          onSubscriptionComplete?.('cloud');
          break;
        case "Yearly":
          redirectUrl = await createYearlySubscriptionCheckout();
          onSubscriptionComplete?.('cloud');
          break;
        case "Lifetime":
          redirectUrl = await createPayOnceLifetimeCheckout();
          onSubscriptionComplete?.('lifetime');
          break;
        case "OneYear":
          redirectUrl = await createPayOnceOneYearCheckout();
          onSubscriptionComplete?.('cloud');
          break;
        default:
          return;
      }
      
      // If there's a redirect URL, navigate to it
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const renderPlanCard = (planType: "subscription" | "lifetime") => {
    const isSubscription = planType === "subscription";
    const planKey = isSubscription
      ? isYearly
        ? "SubscriptionYearly"
        : "SubscriptionMonthly"
      : isLifetime
      ? "PayOnceLifetime"
      : "PayOnceOneYear";
    const product = config.products[planKey];
    const priceKey = isSubscription
      ? isYearly
        ? "yearly"
        : "monthly"
      : isLifetime
      ? "lifetime"
      : "one_year";
    const price = product.prices[priceKey];

    // Add mobile app feature to subscription plan
    const features = [...product.features];
    if (isSubscription) {
      features.push("Access to mobile app (coming soon) for easy screenshots from anywhere");
    }

    return (
      <Card
        className={twMerge(
          "p-6 rounded-xl flex-1 relative shadow-md transition-all hover:shadow-lg bg-white",
          isSubscription && "border-violet-500 border-2"
        )}
      >
        {isSubscription ? (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-violet-100 text-violet-700 px-4 py-1 rounded-full text-sm font-semibold">
              Best Value
            </span>
          </div>
        ) : (
          isLifetime && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-sm font-semibold">
                Self-Hosted
              </span>
            </div>
          )
        )}

        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
                {!isSubscription ? (
                  <div className="ml-2 px-2 py-1 bg-violet-100 rounded-md">
                    <span className="text-xs font-semibold text-violet-700">SELF-HOSTED</span>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3 mt-3 mb-2">
                <span className={`text-sm font-medium ${isSubscription && !isYearly ? 'text-violet-700 font-semibold' : 'text-gray-600'}`}>
                  {isSubscription ? "Monthly" : "1 Year"}
                </span>
                <div className="relative">
                  <Switch
                    checked={isSubscription ? isYearly : isLifetime}
                    onCheckedChange={isSubscription ? setIsYearly : setIsLifetime}
                    className="mt-[2px]"
                  />
                </div>
                <span className={`text-sm font-medium ${isSubscription && isYearly ? 'text-violet-700 font-semibold' : !isSubscription && isLifetime ? 'text-violet-700 font-semibold' : 'text-gray-600'}`}>
                  {isSubscription ? "Yearly" : "Lifetime"}
                </span>
              </div>
            </div>
            <CardDescription className="text-3xl font-bold text-black mt-1">
              ${price.amount / 100}
              {isSubscription && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  /{price.interval}
                  {isYearly && (
                    <div className="text-xs text-violet-600 font-semibold mt-1">
                      Save ~33% with yearly billing
                    </div>
                  )}
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <ul className="space-y-3">
            {(isSubscription ? features : product.features).map((feature: string, index: number) => {
              const isPremiumFeature = feature.toLowerCase().includes("premium") || 
                                       feature.toLowerCase().includes("onboarding") || 
                                       feature.toLowerCase().includes("unlimited");
              const isKeyFeature = index === 0 || 
                                   feature.toLowerCase().includes("ai") || 
                                   feature.toLowerCase().includes("transcription");
              
              return (
                <li key={index} className={`flex items-start text-sm ${isPremiumFeature ? 'opacity-100' : 'opacity-90'}`}>
                  {isPremiumFeature ? (
                    <Sparkles className="h-5 w-5 mr-3 text-violet-500 flex-shrink-0 mt-0.5" />
                  ) : isKeyFeature ? (
                    <Star className="h-5 w-5 mr-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Check className="h-5 w-5 mr-3 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`${isPremiumFeature ? 'text-black font-medium' : isKeyFeature ? 'text-gray-800 font-medium' : 'text-gray-700'}`}>
                    {feature}
                    {isPremiumFeature && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800">
                        Premium
                      </span>
                    )}
                    {isKeyFeature && !isPremiumFeature && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Key Feature
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            className={twMerge(
              "w-full py-6 text-base font-medium transition-all cursor-pointer",
              isSubscription
                ? "bg-violet-600 hover:bg-violet-700 text-white border-none shadow-md hover:shadow-lg"
                : "border-2 border-gray-300 hover:border-violet-400 hover:text-violet-700"
            )}
            variant={isSubscription ? "default" : "outline"}
            onClick={() =>
              handlePlanSelection(
                isSubscription
                  ? isYearly
                    ? "Yearly"
                    : "Monthly"
                  : isLifetime
                  ? "Lifetime"
                  : "OneYear"
              )
            }
          >
            {isSubscription
              ? "Get Started"
              : `Get ${isLifetime ? "Lifetime" : "One Year"} Access`}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {renderPlanCard("subscription")}
        {renderPlanCard("lifetime")}
      </div>
    </div>
  );
}
