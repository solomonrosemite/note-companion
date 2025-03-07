import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// This is a server-side implementation of password verification
// It uses Clerk's API to verify passwords and create sessions

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    
    // Get the Clerk client instance
    const client = await clerkClient();
    
    // First, check if the user exists
    const usersResponse = await client.users.getUserList({
      emailAddress: [email],
    });
    
    if (usersResponse.data.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const user = usersResponse.data[0];
    
    // Check if the user has password authentication enabled
    if (!user.passwordEnabled) {
      return NextResponse.json({ 
        error: "Password authentication not enabled for this user",
        message: "Please use another authentication method or enable password authentication in your account settings."
      }, { status: 401 });
    }
    
    try {
      // Use Clerk's API to verify the password and create a sign-in
      // This is similar to the client-side signIn.create() method
      const response = await fetch(`https://api.clerk.com/v1/client/sign_ins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          password: password,
        }),
      });
      
      if (!response.ok) {
        // If the response is not ok, it's likely due to invalid credentials
        console.error("Error verifying credentials:", await response.text());
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      
      const data = await response.json();
      
      // Check if the sign-in was successful
      if (data.status === "complete") {
        // If the sign-in was successful, return the token and user ID
        return NextResponse.json({
          token: data.created_session_id,
          userId: data.user_id,
          expiresAt: Date.now() + 3600000, // 1 hour expiration
        });
      } else {
        // If the sign-in attempt requires additional verification steps
        return NextResponse.json({ 
          error: "Additional verification required",
          message: "Please complete the additional verification steps to sign in."
        }, { status: 401 });
      }
    } catch (error) {
      // If there's an error verifying the password, it's likely due to invalid credentials
      console.error("Error verifying credentials:", error);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in sign-in:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
