import { NextRequest, NextResponse } from "next/server";
import { handleClerkAuthorization } from "@/lib/handleClerkAuthorization";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";

export async function POST(request: NextRequest) {
  try {
    // Try Clerk authentication first
    try {
      const { userId } = await handleClerkAuthorization(request);
      return NextResponse.json({ message: "Valid session", userId }, { status: 200 });
    } catch (clerkError) {
      // Fall back to API key authentication for backward compatibility
      const { userId } = await handleAuthorizationV2(request);
      return NextResponse.json({ message: "Valid key", userId }, { status: 200 });
    }
  } catch (error) {
    console.log("Error checking authentication", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }
}
