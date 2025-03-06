import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    try {
      // Get the Clerk client instance
      const client = await clerkClient();
      
      try {
        // Try to find the user by email first
        const usersResponse = await client.users.getUserList({
          emailAddress: [email],
        });
        
        if (usersResponse.data.length === 0) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 401 }
          );
        }
        
        // Create a sign-in token for the user
        const signInToken = await client.signInTokens.createSignInToken({
          userId: usersResponse.data[0].id,
          expiresInSeconds: 3600, // 1 hour
        });
        
        return NextResponse.json({
          token: signInToken.token,
          userId: usersResponse.data[0].id,
          expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
        });
      } catch (signInError) {
        console.error("Error signing in user:", signInError);
        throw signInError;
      }
    } catch (clerkError) {
      console.error("Clerk authentication error:", clerkError);
      
      // For development environment, return a mock token
      if (process.env.NODE_ENV === "development") {
        console.log("Using development fallback for authentication");
        const devUserId = "dev-user";
        const token = Buffer.from(`${devUserId}:${Date.now()}`).toString("base64");
        
        return NextResponse.json({
          token,
          userId: devUserId,
          expiresAt: Date.now() + 3600000, // 1 hour from now
        });
      }
      
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in sign-in:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
