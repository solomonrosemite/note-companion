import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { createLicenseKeyFromUserId } from "@/app/actions";

export async function POST(req: NextRequest) {
  try {
    // For development mode, we'll use the current auth session if available
    const { userId } = await auth();
    
    // If we're in development mode and have a userId, use it
    if (process.env.NODE_ENV === 'development' && userId) {
      const { key } = await createLicenseKeyFromUserId(userId);
      
      return NextResponse.json({
        success: true,
        licenseKey: key.key,
        userId,
        message: "Development mode: Using current session",
      });
    }
    
    // For production, we'll need to sign in the user
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
      }, { status: 400 });
    }
    
    // get user
    const usersResponse = await (await clerkClient()).users.getUserList({
      emailAddress: [email],
    });
    
    const users = usersResponse.data;
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No account found with this email",
      }, { status: 400 });
    }
    
    // In a real implementation, you would verify the password
    // This is a simplified version for demonstration purposes
    // In production, this would use Clerk's authentication mechanisms
    
    // For now, we'll just generate a license key for the user
    const { key } = await createLicenseKeyFromUserId(users[0].id);
    
    return NextResponse.json({
      success: true,
      licenseKey: key.key,
      userId: users[0].id,
    });
  } catch (error) {
    console.error("Error signing in:", error);
    
    return NextResponse.json({
      success: false,
      error: "An error occurred during sign in",
    }, { status: 500 });
  }
}