'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Terminal } from "lucide-react";

// Define a basic type for the upload result
interface UploadTestResult {
  success: boolean;
  fileId?: number | string;
  status?: string;
  url?: string;
  text?: string;
  error?: string;
  fileUrl?: string;
  mimeType?: string;
  fileName?: string;
  // Add other potential fields from your API response
}

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTestResult | null>(null); // Use the defined type
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError(null); // Clear previous errors on new file selection
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData,
        // No Content-Type header needed, browser sets it for FormData
      });

      const result: UploadTestResult = await response.json();

      if (!response.ok) {
        // Use error message from API response if available
        throw new Error(result.error || `Upload failed with status: ${response.status}`);
      }
      
      // Store the successful upload result
      setUploadResult(result);
      console.log('Upload successful:', result);
      
    } catch (err: unknown) { // Use unknown for error type
      console.error('Upload error:', err);
      // Type check before accessing message
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
      setError(message);
      setUploadResult(null); // Clear result on error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Upload File for Testing</h1>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Upload a File</CardTitle>
          <CardDescription>
            Use this page to test the file processing and formatting preservation.
            Upload a .txt, .md, image, or PDF file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={handleFileChange} 
                accept=".txt,.md,image/*,application/pdf" // Allow text, markdown, images, pdfs
                disabled={uploading}
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload and Process'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadResult && (
            // Use default variant for success, add an icon
            <Alert variant="default" className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" /> 
              <AlertTitle className="text-green-800">Upload Successful</AlertTitle>
              <AlertDescription>
                File processed. Result:
                <pre className="mt-2 p-2 bg-green-50 rounded-md text-xs overflow-x-auto text-gray-800">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 