import { NextResponse, NextRequest } from "next/server";
import { db, UserUsageTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

// Only enable in development mode
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, tokenUsage, maxTokenUsage } = body;

    // Update or insert user usage for testing
    await db
      .insert(UserUsageTable)
      .values({
        userId: userId || "dev-user",
        tokenUsage: tokenUsage || 5000,
        maxTokenUsage: maxTokenUsage || 10000,
        subscriptionStatus: "active",
        currentPlan: "pro",
        tier: "developer",
        billingCycle: "monthly"
      })
      .onConflictDoUpdate({
        target: UserUsageTable.userId,
        set: {
          tokenUsage: tokenUsage || 5000,
          maxTokenUsage: maxTokenUsage || 10000
        }
      });

    return NextResponse.json({ 
      success: true, 
      message: "Test usage values set successfully" 
    });
  } catch (error) {
    console.error("Error setting test usage values:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
} 