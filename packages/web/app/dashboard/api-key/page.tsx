"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCopy, CheckCircle, Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState<string>(""); // In a real app, you'd fetch this from your backend
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching API key - in a real app, this would be an actual API call
  useEffect(() => {
    // Simulating API call to fetch user's API key
    setTimeout(() => {
      try {
        // Example API key - in real implementation, this would come from a backend
        setApiKey("nc_sub_" + Math.random().toString(36).substring(2, 15));
        setLoading(false);
      } catch (err) {
        setError("Failed to load your API key. Please try again later.");
        setLoading(false);
      }
    }, 1000);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your API Key</h1>
        <p className="text-muted-foreground">
          Use this API key to connect Note Companion to your Obsidian vault
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Keep your API key secure. Never share it with others or store it in public repositories.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Your Note Companion API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                value={loading ? "Loading your API key..." : apiKey}
                readOnly
                disabled={loading}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={loading}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">How to use your API key</h2>
        <ol className="list-decimal list-inside space-y-3">
          <li>
            Open your Obsidian vault and navigate to the Note Companion plugin settings
          </li>
          <li>
            In the plugin settings, find the "API Key" field and paste your key
          </li>
          <li>
            Click "Save" to connect your subscription to your Obsidian vault
          </li>
          <li>
            Restart Obsidian to ensure all features are properly activated
          </li>
        </ol>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
        <p className="mb-4">
          If you're experiencing issues with your API key or need assistance, please reach out to our support team.
        </p>
        <div className="flex gap-4">
          <a href="https://discord.gg/udQnCRFyus" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Join our Discord</Button>
          </a>
          <a href="mailto:support@different.ai" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Email Support</Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
