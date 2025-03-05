import { NextResponse, NextRequest } from "next/server";
import { db, UserUsageTable } from "@/drizzle/schema";
import { and, eq, not } from "drizzle-orm";
import { handleClerkAuthorization } from "@/lib/handleClerkAuthorization";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";

export async function GET(request: NextRequest) {
  try {
    let userId;
    
    // Try Clerk authentication first
    try {
      const result = await handleClerkAuthorization(request);
      userId = result.userId;
    } catch (clerkError) {
      // Fall back to API key authentication
      const result = await handleAuthorizationV2(request);
      userId = result.userId;
    }

    const userUsage = await db
      .select({
        tokenUsage: UserUsageTable.tokenUsage,
        maxTokenUsage: UserUsageTable.maxTokenUsage,
        subscriptionStatus: UserUsageTable.subscriptionStatus,
        currentPlan: UserUsageTable.currentPlan,
      })
      .from(UserUsageTable)
      .where(
        and(
          eq(UserUsageTable.userId, userId),
        )
      )
      .limit(1);

    if (!userUsage.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userUsage[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
