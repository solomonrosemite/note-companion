import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { createLicenseKeyFromUserId } from "@/app/actions";
import { createEmptyUserUsage } from "@/drizzle/schema";

export async function POST(req: NextRequest) {
  try {
    // For development mode, we'll use the current auth session if available
    const { userId } = auth();
    
    // If we're in development mode and have a userId, use it
    if (process.env.NODE_ENV === 'development' && userId) {
      const { key } = await createLicenseKeyFromUserId(userId);
      
      // Create empty usage for this user if needed
      await createEmptyUserUsage(userId);
      
      return NextResponse.json({
        success: true,
        licenseKey: key.key,
        userId,
        message: "Development mode: Using current session",
      });
    }
    
    // For production, we'll need to actually create the user
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        error: "A user with this email already exists",
      }, { status: 400 });
    }
    
    // Create the user in Clerk
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
    });
    
    // Generate a license key for the new user
    const { key } = await createLicenseKeyFromUserId(user.id);
    
    // Create empty usage for this user
    await createEmptyUserUsage(user.id);
    
    return NextResponse.json({
      success: true,
      licenseKey: key.key,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    
    return NextResponse.json({
      success: false,
      error: "An error occurred while creating your account",
    }, { status: 500 });
  }
}