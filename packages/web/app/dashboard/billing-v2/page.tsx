'use client'
import { BillingPage, PricingTable, useBilling } from "@flowglad/nextjs";

export default () => {
  const billing = useBilling();
  if (!billing.catalog) {
    return null;
  }
  return (
    <div>
      {/* <BillingPage billing={billing} /> */}
      <PricingTable
        products={billing.catalog.products.map((product) => ({
          name: product.name,
          description: product.description,
          displayFeatures: product.displayFeatures,
          primaryButtonText: "Subscribe",
          onClickPrimaryButton: () => {
            console.log("Primary button clicked");
            billing.createCheckoutSession({
              priceId: product.prices[0].id,
              successUrl: `${window.location.origin}/dashboard/subscribers`,
              cancelUrl: `${window.location.origin}/dashboard`,
              autoRedirect: true,
            });
          },
          secondaryButtonText: "Learn More",
          prices: product.prices.map((price) => ({
            currency: price.currency,
            unitPrice: price.unitPrice,
            intervalCount: price.intervalCount,
            intervalUnit: price.intervalUnit,
            type: price.type,
            trialPeriodDays: price.trialPeriodDays,
          })),
        }))}
      />
    </div>
  );
};
