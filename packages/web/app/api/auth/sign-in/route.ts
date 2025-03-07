import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Use Clerk's sign-in method to verify credentials.
    // Note: Adjust the method and fields below according to Clerk's official documentation.
    const signInResponse = await clerkClient.signIn.create({
      identifier: email,
      password: password,
    });
    
    // Check if the sign in attempt was completed successfully
    if (signInResponse.status !== "complete") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Extract the userId and token from the response
    const userId = signInResponse.userId;
    // Depending on your Clerk setup, you might have a session token or similar field
    const token = signInResponse.createdSessionId; // Adjust this field as needed
    const expiresAt = Date.now() + 3600000; // Example: token expires in 1 hour
    
    return NextResponse.json({
      token,
      userId,
      expiresAt,
    });
  } catch (error) {
    console.error("Error in sign-in:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
