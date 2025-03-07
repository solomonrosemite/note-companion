import { Notice, RequestUrlResponse, requestUrl } from "obsidian";
import { logMessage } from "./someUtils";
import { logger } from "./services/logger";

export async function makeApiRequest<T>(
  requestFn: () => Promise<RequestUrlResponse>
): Promise<RequestUrlResponse> {
  logMessage("Making API request", requestFn);
  const response: RequestUrlResponse = await requestFn();
  if (response.status >= 200 && response.status < 300) {
    return response;
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
): Promise<{ isValid: boolean; errorMessage?: string }> {
  try {
    console.log(`Checking license key at ${serverUrl}/api/check-key`);
    
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/check-key`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    
    console.log("License check response status:", response.status);
    console.log("License check response data:", response.json);
    
    if (response.status === 200) {
      // Check if the response contains a valid message
      const validMessages = ["Valid key", "Valid session", "Development mode"];
      if (response.json && response.json.message && validMessages.includes(response.json.message)) {
        console.log(`License key valid with message: ${response.json.message}`);
        return { isValid: true };
      } else {
        console.error("License key response not recognized:", response.json);
        return { 
          isValid: false, 
          errorMessage: response.json?.error || "Invalid license key response" 
        };
      }
    } else {
      console.error("License key check failed with status:", response.status);
      return { 
        isValid: false, 
        errorMessage: response.json?.error || "Invalid license key" 
      };
    }
  } catch (error) {
    console.error("Error checking API key:", error);
    logger.error("Error checking API key:", error);
    return { 
      isValid: false, 
      errorMessage: error instanceof Error ? error.message : "Failed to validate license key" 
    };
  }
}

export async function checkClerkAuth(
  serverUrl: string,
  token: string
): Promise<boolean> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: `${serverUrl}/api/auth/validate`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    logger.error("Error checking Clerk authentication:", error);
    return false;
  }
}
