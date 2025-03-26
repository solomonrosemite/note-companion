import { NextResponse, NextRequest } from "next/server";
import { db, UserUsageTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await handleAuthorizationV2(request);

    // For local development/testing - simulate token usage
    if (process.env.NODE_ENV === "development" && request.url.includes("3010")) {
      return NextResponse.json({
        tokenUsage: 11000,
        maxTokenUsage: 10000,
        subscriptionStatus: "active",
        currentPlan: "pro",
        tier: "developer"
      });
    }

    const userUsage = await db
      .select({
        tokenUsage: UserUsageTable.tokenUsage,
        maxTokenUsage: UserUsageTable.maxTokenUsage,
        subscriptionStatus: UserUsageTable.subscriptionStatus,
        currentPlan: UserUsageTable.currentPlan,
        tier: UserUsageTable.tier,
      })
      .from(UserUsageTable)
      .where(and(eq(UserUsageTable.userId, userId)))
      .limit(1);

    if (!userUsage.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userUsage[0]);
  } catch (error) {
    // For local testing, you can optionally send a successful response even on error
    if (process.env.NODE_ENV === "development" && request.url.includes("3010")) {
      return NextResponse.json({
        tokenUsage: 11000, 
        maxTokenUsage: 10000,
        subscriptionStatus: "active",
        currentPlan: "pro",
        tier: "developer"
      });
    }

    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
