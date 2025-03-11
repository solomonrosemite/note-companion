import PostHogClient from "@/lib/posthog";
import { incrementTokenUsage } from "../drizzle/schema";

export async function incrementAndLogTokenUsage(
  userId: string,
  tokens: number
) {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return { remaining: 0, usageError: false };
  }
  
  // Validate tokens is a valid number
  const validTokens = Number.isNaN(tokens) ? 0 : Math.max(0, Math.floor(tokens));
  
  const { remaining, usageError } = await incrementTokenUsage(userId, validTokens);

  if (!usageError) {
    const client = PostHogClient();
    if (client) {
      client.capture({
        distinctId: userId,
        event: "token_usage",
        properties: {
          remaining,
          tokens: validTokens,
        },
      });
    }
  }
  return { remaining, usageError };
}
