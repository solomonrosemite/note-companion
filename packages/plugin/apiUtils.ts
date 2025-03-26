import { Notice, RequestUrlResponse, requestUrl } from "obsidian";
import { logMessage } from "./someUtils";
import { logger } from "./services/logger";

export async function makeApiRequest<T = unknown>(
  requestFn: () => Promise<RequestUrlResponse>
): Promise<T> {
  logMessage("Making API request", requestFn);
  const response: RequestUrlResponse = await requestFn();
  if (response.status >= 200 && response.status < 300) {
    return response.json as T;
  }
  if (response.json.error) {
    new Notice(`File Organizer error: ${response.json.error}`, 6000);
    throw new Error(response.json.error);
  }
  throw new Error("Unknown error");
}

export async function checkLicenseKey(
  serverUrl: string,
  key: string
): Promise<{ valid: boolean; overLimit: boolean }> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/check-key`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    
    // If status=200 => key is valid
    if (response.status === 200) {
      return { valid: true, overLimit: false };
    }
    
    // If status=429 => key is valid but user has hit token limit
    if (response.status === 429) {
      // Check if the response explicitly confirms overLimit
      if (response.json && response.json.overLimit) {
        return { valid: true, overLimit: true };
      }
      // Fallback detection based on status code
      return { valid: true, overLimit: true };
    }
    
    // For everything else => key is invalid
    return { valid: false, overLimit: false };
  } catch (error) {
    logger.error("Error checking API key:", error);
    // On error, treat key as invalid
    return { valid: false, overLimit: false };
  }
}
