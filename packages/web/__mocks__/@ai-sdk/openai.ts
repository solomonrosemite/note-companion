export const openai = jest.fn((model: string, options: any) => ({
  generateText: jest.fn().mockImplementation(async ({ prompt }) => ({
    text: "Mocked response",
    experimental_providerMetadata: {
      openai: {
        annotations: [
          {
            type: "url_citation",
            url_citation: {
              url: "https://example.com",
              title: "Example Page Title",
              start_index: 0,
              end_index: 15
            }
          }
        ]
      }
    }
  }))
}));

export type OpenAIProviderMetadata = {
  annotations?: Array<{
    type: string;
    url_citation?: {
      url: string;
      title: string;
      start_index: number;
      end_index: number;
    };
  }>;
};