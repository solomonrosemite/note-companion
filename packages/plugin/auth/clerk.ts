import { requestUrl, RequestUrlResponse } from "obsidian";
import { logger } from "../services/logger";

export interface ClerkAuthResponse {
  token: string;
  userId: string;
  expiresAt: number;
}

export async function signInWithClerk(
  serverUrl: string,
  email: string,
  password: string
): Promise<ClerkAuthResponse | null> {
  try {
    console.log(`Attempting to sign in with Clerk at ${serverUrl}/api/auth/sign-in`);
    
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/auth/sign-in`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log("Clerk sign-in response status:", response.status);
    
    if (response.status === 200) {
      console.log("Clerk authentication successful");
      return response.json;
    }
    
    // Handle error responses with proper error messages
    if (response.json && response.json.error) {
      console.error("Clerk authentication error:", response.json.error);
      throw new Error(response.json.error);
    } else {
      console.error("Clerk authentication failed with status:", response.status);
      throw new Error(`Authentication failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Error signing in with Clerk:", error);
    logger.error("Error signing in with Clerk:", error);
    
    // Re-throw the error with a more user-friendly message if it's a network error
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error("Could not connect to authentication server. Please check your internet connection.");
      }
      throw error;
    }
    
    throw new Error("Authentication failed. Please try again later.");
  }
}

export async function refreshClerkToken(
  serverUrl: string,
  token: string
): Promise<ClerkAuthResponse | null> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/auth/refresh`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (response.status === 200) {
      return response.json;
    }
    return null;
  } catch (error) {
    logger.error("Error refreshing Clerk token:", error);
    return null;
  }
}

export async function isClerkTokenValid(
  serverUrl: string,
  token: string
): Promise<boolean> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/auth/validate`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error("Error validating Clerk token:", error);
    return false;
  }
}
