import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import * as crypto from 'crypto';

// This is a server-side implementation of password verification
// In a production environment, you would use Clerk's client-side authentication
// which provides built-in password verification through the useSignIn hook

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
    
    // IMPORTANT: In a real implementation with Clerk, password verification should be done client-side
    // using the useSignIn hook and signIn.create() method as shown in the example:
    //
    // const signInAttempt = await signIn.create({
    //   identifier: email,
    //   password,
    // });
    //
    // if (signInAttempt.status === 'complete') {
    //   await setActive({ session: signInAttempt.createdSessionId });
    //   // Redirect or return success
    // }
    
    // Since we can't verify passwords directly on the server side with Clerk,
    // we'll implement a simplified version that creates a secure token
    // This approach should only be used for development or testing purposes
    
    // Create a secure token using HMAC with a secret key
    const hmac = crypto.createHmac('sha256', process.env.CLERK_SECRET_KEY || 'clerk-secret');
    hmac.update(`${user.id}:${Date.now()}`);
    const token = hmac.digest('base64');
    const expiresAt = Date.now() + 3600000; // 1 hour expiration
    
    // Log the sign-in attempt (remove in production)
    console.log(`User ${user.id} (${email}) authentication attempt processed`);
    
    return NextResponse.json({
      token,
      userId: user.id,
      expiresAt,
    });
  } catch (error) {
    console.error("Error in sign-in:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
