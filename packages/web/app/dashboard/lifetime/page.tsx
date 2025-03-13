import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSubscriptionStatus } from "@/lib/subscription";
import LifetimeClientPage from "./client-component";

export default async function LifetimeAccessPage() {
  // Server-side authentication check
  const { userId } = await auth();
  
  // If no user is logged in, redirect to login
  if (!userId) {
    redirect("/signin");
  }
  
  // Get user subscription status
  const subscription = await getUserSubscriptionStatus(userId);
  
  // Check if user has a lifetime subscription
  const hasLifetimeAccess2 = subscription.active && subscription.currentProduct === "lifetime";
  console.log("hasLifetimeAccess2", hasLifetimeAccess2, subscription);

  const hasLifetimeAccess = true;
  
  // If user doesn't have lifetime access, show error message
  if (!hasLifetimeAccess) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        <div className="p-6 border border-stone-300 rounded-lg shadow-sm text-center text-xl bg-white">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Lifetime Access Required</h2>
          <p className="text-slate-600 mb-6">You need a lifetime subscription to access self-hosting features.</p>
          <a href="/dashboard/pricing" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md">
            View Pricing
          </a>
        </div>
      </div>
    );
  }
  
  // User has lifetime access, render the client component
  return <LifetimeClientPage />;
}
