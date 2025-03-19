import { clerkClient, auth } from "@clerk/nextjs/server";
import { verifyKey } from "@unkey/api";
import { NextRequest } from "next/server";
import { checkTokenUsage, checkUserSubscriptionStatus } from "../drizzle/schema";
import PostHogClient from "./posthog";

/**
 * @deprecated This function is being deprecated in favor of a new authorization method.
 * Please use the new handleAuthorizationV2 function instead.
 */
async function handleLogging(
  req: NextRequest,
  userId: string,
  isCustomer: boolean
) {
  const authClient = await clerkClient();
  const user = await authClient.users.getUser(userId);
  const client = PostHogClient();
  if (client) {
    client.capture({
      distinctId: userId,
      event: "call-api",
      properties: {
        endpoint: req.nextUrl.pathname.replace("/api/", ""),
        isCustomer,
        email: user?.emailAddresses[0]?.emailAddress,
      },
    });
  }
}

async function handleLoggingV2(
  req: NextRequest,
  userId: string,
) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  console.log("user", user.emailAddresses[0]?.emailAddress);
  const posthogClient = PostHogClient();
  if (posthogClient) {
    posthogClient.capture({
      distinctId: userId,
      event: "call-api",
      properties: {
        endpoint: req.nextUrl.pathname.replace("/api/", ""),
        email: user?.emailAddresses[0]?.emailAddress,
      },
    });
  }
}

class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export const getToken = (req: NextRequest) => {
  const header = req.headers.get("authorization");
  const token = header?.replace("Bearer ", "");
  return token;
};

export async function handleAuthorizationV2(req: NextRequest) {
  // this is to allow people to self host it easily without
  // setting up clerk
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return { userId: "user", isCustomer: true };
  }

  // First, try API key authentication
  const token = getToken(req);
  if (token) {
    try {
      const { result, error } = await verifyKey(token);
      if (result.valid) {
        // API key is valid
        console.log("API key authentication successful");
        // Check subscription status
        const isActive = await checkUserSubscriptionStatus(result.ownerId);
        if (!isActive) {
          throw new AuthorizationError("Subscription canceled or inactive", 403);
        }
        // Might require await
        handleLoggingV2(req, result.ownerId);
        return { userId: result.ownerId };
      }
    } catch (error) {
      console.error("API key validation error:", error);
      // Continue to try Clerk authentication if API key validation fails
    }
  }

  // If API key authentication failed or wasn't provided, try Clerk authentication
  try {
    const { userId } = await auth();
    if (userId) {
      console.log("Clerk authentication successful");
      // Check subscription status
      const isActive = await checkUserSubscriptionStatus(userId);
      if (!isActive) {
        throw new AuthorizationError("Subscription canceled or inactive", 403);
      }
      handleLoggingV2(req, userId);
      return { userId };
    }
  } catch (error) {
    console.error("Clerk authentication error:", error);
    // Authentication failed, will throw below
  }

  // If we reach here, both authentication methods failed
  throw new AuthorizationError("Unauthorized", 401);
}

/**
 * @deprecated This function is being deprecated in favor of a new authorization method.
 * Please use the new handleAuthorizationV2 function instead.
 */
export async function handleAuthorization(req: NextRequest) {
  // this is to allow people to self host it easily without
  // setting up clerk
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return { userId: "user", isCustomer: true };
  }

  const header = req.headers.get("authorization");
  const { url, method } = req;
  console.log({ url, method });

  if (!header) {
    throw new AuthorizationError("No Authorization header", 401);
  }

  const token = header.replace("Bearer ", "");
  const { result, error } = await verifyKey(token);

  if (!result.valid) {
    console.error(result);
    throw new AuthorizationError(`Unauthorized: ${result.code}`, 401);
  }

  // Check subscription status
  const isActive = await checkUserSubscriptionStatus(result.ownerId);
  if (!isActive) {
    throw new AuthorizationError("Subscription canceled or inactive", 403);
  }

  // Check token usage
  const { remaining, usageError } = await checkTokenUsage(result.ownerId);
  console.log("remaining", remaining);

  if (usageError) {
    throw new AuthorizationError("Error checking token usage", 500);
  }

  if (remaining <= 0) {
    throw new AuthorizationError(
      "Credits limit exceeded. Top up your credits in settings.",
      429
    );
  }

  await handleLogging(req, result.ownerId, false);

  return { userId: result.ownerId };
}
