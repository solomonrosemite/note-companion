import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PutBlobResult } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    // Verify authentication using Clerk
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { extension } = await request.json();
    if (!extension) {
      return NextResponse.json({ error: "Extension is required" }, { status: 400 });
    }

    // Generate a presigned URL for upload
    const response = await fetch(`${process.env.BLOB_API_URL}/presigned-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pathname: `transcribe/${session.userId}/${Date.now()}.${extension}`,
        contentType: `audio/${extension}`,
        access: 'public',
        multipart: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }

    const { url, uploadUrl } = await response.json();
    return NextResponse.json({ url, uploadUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
} 