import { NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from '@vercel/blob';
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink } from 'fs/promises';

const CHUNK_SIZE = 24 * 60; // 24 minutes in seconds (just under Whisper's 25 min limit)

// Schema for request validation
const requestSchema = z.object({
  audio: z.string(),
  extension: z.string().refine(ext => ['mp3', 'mp4', 'mpeg', 'mpga', 'wav', 'webm'].includes(ext)),
});

// Helper function to split audio into chunks
async function splitAudioIntoChunks(audioBuffer: Buffer, extension: string) {
  const chunks: Buffer[] = [];
  
  // Create temporary file for ffprobe
  const tempFile = join(tmpdir(), `audio-${Date.now()}.${extension}`);
  const writeStream = createWriteStream(tempFile);
  await new Promise<void>((resolve, reject) => {
    writeStream.write(audioBuffer, (error) => {
      if (error) reject(error);
      else {
        writeStream.end();
        resolve();
      }
    });
  });

  try {
    // Get audio duration using ffprobe
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempFile, (err, metadata) => {
        if (err) reject(err);
        resolve(metadata.format.duration || 0);
      });
    });

    // If audio is shorter than chunk size, return it as is
    if (duration <= CHUNK_SIZE) {
      return [audioBuffer];
    }

    // Split into chunks
    const numChunks = Math.ceil(duration / CHUNK_SIZE);
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const chunkFile = join(tmpdir(), `chunk-${i}-${Date.now()}.${extension}`);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempFile)
          .setStartTime(start)
          .setDuration(CHUNK_SIZE)
          .toFormat(extension)
          .on('error', reject)
          .on('end', () => resolve())
          .save(chunkFile);
      });

      const chunkBuffer = await readFile(chunkFile);
      await unlink(chunkFile).catch(() => {});
      chunks.push(chunkBuffer);
    }

    return chunks;
  } finally {
    // Clean up temp file
    await unlink(tempFile).catch(() => {});
  }
}

// Helper function to read file as buffer
async function readFile(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) reject(err);
      else {
        import('fs/promises').then(fs => 
          fs.readFile(path).then(resolve).catch(reject)
        ).catch(reject);
      }
    });
  });
}

export const maxDuration = 300; // 5 minutes for the API route

export async function POST(request: Request) {
  try {
    // Verify authentication using Clerk
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { audio, extension } = result.data;
    const base64Data = audio.split(";base64,").pop();
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid base64 data" }, { status: 400 });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Upload to Vercel Blob with 1-hour cache
    const { url } = await put(`transcribe/${session.userId}/${Date.now()}.${extension}`, audioBuffer, {
      access: 'public',
      addRandomSuffix: true,
      cacheControlMaxAge: 3600, // 1 hour cache
    });

    // Initialize OpenAI
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Split audio into chunks if needed
    const chunks = await splitAudioIntoChunks(audioBuffer, extension);
    
    // Process chunks in parallel with rate limiting
    const transcriptionPromises = chunks.map(async (chunk, index) => {
      // Add delay between chunks to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, index * 1000));
      
      const transcription = await openai.audio.transcriptions.create({
        file: new File([new Uint8Array(chunk)], `chunk-${index}.${extension}`, { type: `audio/${extension}` }),
        model: "whisper-1",
      });
      
      return transcription.text;
    });

    // Stream results back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const promise of transcriptionPromises) {
            const text = await promise;
            controller.enqueue(encoder.encode(text + " "));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 