import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserUsageTable, db } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user ID
    const { userId } = await auth();
    
    // If no user is logged in, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch the user subscription status from the database
    const userUsage = await db
      .select()
      .from(UserUsageTable)
      .where(eq(UserUsageTable.userId, userId))
      .limit(1)
      .execute();
    
    // If no user usage record found, return default values
    if (!userUsage.length) {
      return NextResponse.json({
        subscriptionStatus: "inactive",
        paymentStatus: "unpaid",
        currentProduct: null,
        billingCycle: "none"
      });
    }
    
    // Return the subscription data
    return NextResponse.json({
      subscriptionStatus: userUsage[0].subscriptionStatus,
      paymentStatus: userUsage[0].paymentStatus,
      currentProduct: userUsage[0].currentProduct,
      billingCycle: userUsage[0].billingCycle
    });
    
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Error fetching subscription status" },
      { status: 500 }
    );
  }
}
