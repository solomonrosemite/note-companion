import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock the OpenAI SDK
jest.mock("@ai-sdk/openai", () => ({
  openai: jest.fn(() => ({
    generateText: jest.fn().mockImplementation(async () => ({
      text: "Test response",
      experimental_providerMetadata: {
        openai: {
          annotations: [
            {
              type: "url_citation",
              url_citation: {
                url: "https://example.com",
                title: "Example Website",
                start_index: 10,
                end_index: 20
              }
            }
          ]
        }
      }
    }))
  }))
}));

describe("Chat API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include citation metadata in response", async () => {
    const mockRequest = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What's the latest news about AI?" }],
        model: "gpt-4o-search-preview",
        enableSearchGrounding: true
      }),
      headers: {
        'x-user-id': 'test-user'
      }
    });

    const response = await POST(mockRequest);
    expect(response instanceof Response).toBe(true);
    
    // Read the stream and check for metadata
    const reader = (response as Response).body?.getReader();
    if (!reader) throw new Error("No response body");

    let foundMetadata = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(5));
          if (data.type === "metadata" && data.data?.citations) {
            foundMetadata = true;
            break;
          }
        }
      }
    }

    expect(foundMetadata).toBe(true);
  });
});
