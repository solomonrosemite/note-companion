import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Import auth instead of getToken

// Assuming NEXT_PUBLIC_API_URL is set in your environment for the web package
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function POST(req: NextRequest) {
  // Use auth() to get userId and session claims if needed
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Retrieve the raw token if needed for forwarding (Clerk automatically handles session)
  // However, forwarding the user's session/token directly might not be standard practice
  // or necessary if the target endpoint also uses auth()
  // Let's rely on the session cookie being forwarded implicitly by fetch on the same domain,
  // or explicitly pass the userId if the target endpoint needs it.
  // We will forward the user ID in a custom header for the target endpoint to verify.

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in the request' }, { status: 400 });
    }

    // Create a new FormData to forward
    const forwardData = new FormData();
    forwardData.append('file', file, file.name);
     // Add any other necessary fields expected by /api/upload
     // e.g., forwardData.append('someOtherField', formData.get('someOtherField'));

    // Construct the target URL for the primary upload endpoint
    if (!BASE_API_URL) {
       console.error('NEXT_PUBLIC_API_URL environment variable is not set.');
       return NextResponse.json({ error: 'Server configuration error: API URL missing.' }, { status: 500 });
    }
    const targetUrl = `${BASE_API_URL}/api/upload`;


    console.log(`Forwarding upload request for ${file.name} from user ${userId} to ${targetUrl}`);

    // Forward the request
    // Add a custom header with the userId if the target endpoint needs to verify the user
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        // IMPORTANT: Forwarding the raw Authorization header might expose tokens unnecessarily.
        // Instead, the target /api/upload should use auth() to verify the user session based on cookies.
        // If explicit user identification is needed, pass userId in a custom header.
        'X-Forwarded-User-Id': userId,
        // Let fetch set the Content-Type with boundary for FormData
      },
      body: forwardData,
    });

    // Check if the forwarded request was successful
    if (!response.ok) {
      // Attempt to parse error from the target endpoint
      let errorBody = { error: `Forwarded upload failed with status ${response.status}` };
      try {
        const upstreamError = await response.json();
        errorBody = upstreamError; // Use the error from the upstream service
        console.error(`Error from ${targetUrl}:`, JSON.stringify(upstreamError));
      } catch (e) {
         const textError = await response.text();
         console.error(`Non-JSON error response from ${targetUrl}:`, textError);
         errorBody.error = textError || errorBody.error;
      }
      // Return the error response from the target endpoint, preserving its status code
      return NextResponse.json(errorBody, { status: response.status });
    }

    // If successful, parse the response from the target endpoint and return it
    const responseData = await response.json();
    console.log(`Successfully forwarded upload for ${file.name}. Response from ${targetUrl}:`, responseData);

    return NextResponse.json(responseData, { status: response.status });

  } catch (error: unknown) { // Use unknown for the catch block
    console.error('Error in /api/upload-test:', error);
    // Type check the error before accessing properties
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while forwarding the upload.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 