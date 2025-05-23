import { NextRequest, NextResponse } from "next/server";
import { db, uploadedFiles, UploadedFile } from "@/drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Mistral } from "@mistralai/mistralai";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import sharp from "sharp";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// --- R2/S3 Configuration ---
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || "auto";

if (
  !R2_BUCKET ||
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY
) {
  console.error("Missing R2 environment variables for background worker!");
}

const r2Client = new S3Client({
  endpoint: R2_ENDPOINT,
  region: R2_REGION,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

// --- Reused Helper Functions from process-file/route.ts --- //

// Define interfaces (consider moving these to a shared types file)
interface ProcessingError extends Error {
  code?: string;
  statusCode?: number;
}
interface OCRImage { url?: string; data?: string; type?: string; }
interface OCRPage { index: number; markdown: string; images: OCRImage[]; dimensions: { dpi: number; height: number; width: number; }; }
interface OCRResponse { pages?: OCRPage[]; data?: { text?: string; content?: string; markdown?: string; }; text?: string; content?: string; markdown?: string; items?: Array<{ text?: string }>; usage?: { total_tokens?: number; totalTokens?: number; }; rawResponse?: unknown; fullResponse?: unknown; }

// Helper to download from R2 and return a Buffer
async function downloadFromR2(key: string): Promise<Buffer> {
  console.log(`Downloading from R2: ${key}`);
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  try {
    const response = await r2Client.send(command);
    if (!response.Body) {
      throw new Error("No body received from R2 getObject");
    }
    // Convert stream to buffer
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (error) {
    console.error(`Error downloading ${key} from R2:`, error);
    throw new Error(`Failed to download file from R2: ${key}`);
  }
}

// (Paste compressImage, extractTextFromOCRResponse, processImageWithGPT4o here)
// Helper function to compress image
async function compressImage(
  buffer: Buffer,
  fileType: string
): Promise<Buffer> {
  // Skip compression for non-image files
  if (!fileType.startsWith("image/")) {
    return buffer;
  }

  try {
    // ... (rest of compressImage function - same as in process-file/route.ts)
    console.log(
      `Compressing image of type ${fileType} and size ${buffer.length} bytes`
    );
    let format: string;
    if (fileType === "image/jpeg" || fileType === "image/jpg") { format = "jpeg"; }
    else if (fileType === "image/png") { format = "png"; }
    else if (fileType === "image/webp") { format = "webp"; }
    else if (fileType === "image/gif") { format = "gif"; }
    else if (fileType === "image/tiff") { format = "tiff"; }
    else { format = "jpeg"; }

    let processedImage = sharp(buffer);
    const metadata = await processedImage.metadata();
    const MAX_DIMENSION = 3000;
    if ((metadata.width && metadata.width > MAX_DIMENSION) || (metadata.height && metadata.height > MAX_DIMENSION)) {
      console.log(`Resizing large image from ${metadata.width}x${metadata.height}`);
      processedImage = processedImage.resize({
        width: metadata.width && metadata.width > MAX_DIMENSION ? MAX_DIMENSION : undefined,
        height: metadata.height && metadata.height > MAX_DIMENSION ? MAX_DIMENSION : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    if (format === "jpeg") { processedImage = processedImage.jpeg({ quality: 85, mozjpeg: true }); }
    else if (format === "png") { processedImage = processedImage.png({ compressionLevel: 9, adaptiveFiltering: true }); }
    else if (format === "webp") { processedImage = processedImage.webp({ quality: 85 }); }
    else { processedImage = processedImage.rotate(); } // No-op

    const compressedBuffer = await processedImage.toBuffer();
    console.log(`Compressed image from ${buffer.length} to ${compressedBuffer.length} bytes (${Math.round((compressedBuffer.length / buffer.length) * 100)}%)`);
    return compressedBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    return buffer;
  }
}

// Helper function to extract text from OCR response
function extractTextFromOCRResponse(ocrResponse: OCRResponse): { textContent: string; tokensUsed: number; } {
  try {
    // ... (rest of extractTextFromOCRResponse function - same as in process-file/route.ts)
    console.log("Extracting text from OCR response");
    let textContent = "";
    let tokensUsed = 0;
    if (Array.isArray(ocrResponse.pages)) { textContent = ocrResponse.pages.map((page: OCRPage) => page.markdown || "").join("\n\n"); }
    else if (ocrResponse.data?.text) { textContent = ocrResponse.data.text; }
    else if (ocrResponse.data?.content) { textContent = ocrResponse.data.content; }
    else if (ocrResponse.data?.markdown) { textContent = ocrResponse.data.markdown; }
    else if (ocrResponse.text) { textContent = ocrResponse.text; }
    else if (ocrResponse.content) { textContent = ocrResponse.content; }
    else if (ocrResponse.markdown) { textContent = ocrResponse.markdown; }
    else if (Array.isArray(ocrResponse.items)) { textContent = ocrResponse.items.map((item) => item.text || "").join(" "); }
    else { const safeResponse = { ...ocrResponse }; delete safeResponse.rawResponse; delete safeResponse.fullResponse; textContent = `OCR Response: ${JSON.stringify(safeResponse)}`; }

    if (ocrResponse.usage) {
      if (typeof ocrResponse.usage.total_tokens === "number") { tokensUsed = ocrResponse.usage.total_tokens; }
      else if (typeof ocrResponse.usage.totalTokens === "number") { tokensUsed = ocrResponse.usage.totalTokens; }
      else { tokensUsed = Math.ceil(textContent.length / 4); }
    } else { tokensUsed = Math.ceil(textContent.length / 4); }
    return { textContent, tokensUsed };

  } catch (error) {
    console.error("Error extracting text from OCR response:", error);
    return { textContent: `Error extracting text: ${error instanceof Error ? error.message : String(error)}`, tokensUsed: 0 };
  }
}

// Helper function to process image with gpt-4o
async function processImageWithGPT4o(imageUrl: string): Promise<{ textContent: string; tokensUsed: number }> {
  try {
    // ... (rest of processImageWithGPT4o function - same as in process-file/route.ts)
    console.log("Processing image with gpt-4.1...");
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // log url
    console.log(`Processing image with gpt-4.1: ${imageUrl}`);
    const { object, usage } = await generateObject({
      model: openai("gpt-4.1"),
      schema: z.object({ markdown: z.string() }),
      messages: [
        { role: "system", content: "Extract all text comprehensively, preserving formatting." },
        { role: "user", content: [{ type: "image", image: imageUrl }] },
      ],
    });
    const textContent = object.markdown || "";
    // Attempt to get actual token usage if the SDK provides it
    const tokensUsed = usage?.totalTokens ?? Math.ceil(textContent.length / 4); // Estimate if not available
    console.log(`gpt-4.1 extracted ${textContent.length} chars, used approx ${tokensUsed} tokens`);
    return { textContent, tokensUsed };
  } catch (error) {
    console.error("Error processing image with gpt-4.1:", error);
    return { textContent: `Error processing image with gpt-4.1: ${error instanceof Error ? error.message : String(error)}`, tokensUsed: 0 };
  }
}

// --- Reusable Processing Function ---
async function processSingleFileRecord(fileRecord: UploadedFile): Promise<{ status: 'completed' | 'error'; textContent: string | null; tokensUsed: number; error: string | null; }> {
  const fileId = fileRecord.id;
  let textContent = "";
  let tokensUsed = 0;
  let processingError: string | null = null;

  try {
    console.log(`Starting single file processing for ID: ${fileId}`);

    // Determine R2 key
    let r2Key = fileRecord.r2Key;
    if (!r2Key) {
        // Basic parsing - assumes URL structure like .../uploads/userId/uuid-filename
        const urlParts = fileRecord.blobUrl.split('/');
        // Find the 'uploads' segment and take everything after it
        const uploadSegmentIndex = urlParts.findIndex(part => part === 'uploads');
        if (uploadSegmentIndex !== -1 && uploadSegmentIndex < urlParts.length - 1) {
            r2Key = urlParts.slice(uploadSegmentIndex).join('/');
             console.log(`Derived R2 key from blobUrl: ${r2Key}`);
        } else {
             throw new Error(`Could not determine R2 key from blobUrl: ${fileRecord.blobUrl}`);
        }
    }
    if (!r2Key) {
         throw new Error(`Missing R2 key for file ID ${fileId}`);
    }

    // Download file from R2
    const buffer = await downloadFromR2(r2Key);

    const fileType = fileRecord.fileType.toLowerCase();

    // --- Processing Logic ---
    if (fileType === "application/pdf" || fileType.includes("pdf")) {
      // TODO: Implement PDF processing logic if needed
      console.warn(`PDF processing (${fileId}) in background worker needs full implementation`);
      processingError = "PDF processing not yet fully implemented.";
      textContent = "[PDF Content - Processing Pending Implementation]";
      tokensUsed = 0;
    } else if (fileType.startsWith("image/")) {
      console.log(`Processing Image (${fileId}) using GPT-4o with URL: ${fileRecord.blobUrl}`);
      const result = await processImageWithGPT4o(fileRecord.blobUrl); // Use the correct public URL
      textContent = result.textContent;
      tokensUsed = result.tokensUsed;
      // Check if the processing function itself returned an error message
      if (textContent.startsWith("Error processing image")) {
        processingError = textContent; // Capture the error message from the helper
      }
    } else {
      console.warn(`Unsupported file type for processing: ${fileType}`);
      processingError = `Unsupported file type: ${fileType}`;
    }
    // --- End Processing Logic ---

    // Final check for empty content *only if there wasn't already an error*
    if (!processingError && (!textContent || textContent.trim() === "")) {
      console.warn(`No text content extracted for file ${fileId}`);
      textContent = "[OCR completed, but no text extracted]"; // Indicate OCR ran but found nothing
    }

  } catch (error: unknown) {
    console.error(`Error during single file processing ${fileId}:`, error);
    processingError = error instanceof Error ? error.message : "Unknown processing error";
    // Ensure textContent is nullified if an overarching error occurred
    textContent = null;
    tokensUsed = 0;
  }

  const finalStatus = processingError ? "error" : "completed";
  console.log(`Single file processing result for ${fileId}: Status=${finalStatus}, Error=${processingError}`);
  return {
    status: finalStatus,
    textContent: processingError ? null : textContent, // Return null textContent on error
    tokensUsed: processingError ? 0 : tokensUsed,    // Return 0 tokensUsed on error
    error: processingError,
  };
}

// --- Main Worker Logic --- //

export async function GET(request: NextRequest) {
  // 1. Authorization Check (Using a simple secret header for cron jobs)
  const cronSecret = request.headers.get("authorization")?.split(" ")[1];
  if (cronSecret !== process.env.CRON_SECRET) {
    console.warn("Unauthorized cron job attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Starting background processing job...");
  let processedCount = 0;
  let errorCount = 0;

  try {
    // 2. Fetch pending files (limit batch size)
    const pendingFiles = await db
      .select()
      .from(uploadedFiles)
      // Fetch 'pending' or 'processing' (in case a previous run timed out after marking as processing)
      .where(or(eq(uploadedFiles.status, "pending"), eq(uploadedFiles.status, "processing")))
      .limit(10); // Process up to 10 files per run

    if (pendingFiles.length === 0) {
      console.log("No pending files to process.");
      return NextResponse.json({ message: "No pending files" });
    }

    console.log(`Found ${pendingFiles.length} pending/processing files to attempt.`);

    // 3. Process each file
    for (const fileRecord of pendingFiles) {
      const fileId = fileRecord.id;
      const userId = fileRecord.userId;

      try {
        // Optimistically update status to processing *before* heavy lifting
        // This helps identify files that might timeout during processing
        if (fileRecord.status !== 'processing') {
            await db
              .update(uploadedFiles)
              .set({ status: "processing", updatedAt: new Date(), error: null }) // Clear previous error on retry
              .where(eq(uploadedFiles.id, fileId));
             console.log(`Marked file ${fileId} as processing.`);
        } else {
             console.log(`File ${fileId} was already marked as processing, retrying...`);
        }


        // Call the reusable processing function
        const result = await processSingleFileRecord(fileRecord);

        // 4. Update Database Record with the final result
        await db
          .update(uploadedFiles)
          .set({
            status: result.status,
            textContent: result.textContent,
            tokensUsed: result.tokensUsed,
            error: result.error, // Store error message if processing failed
            updatedAt: new Date(),
          })
          .where(eq(uploadedFiles.id, fileId));

        console.log(`Finished processing file ${fileId} with final status: ${result.status}`);

        // 5. Increment Token Usage (only on successful completion)
        if (result.status === 'completed' && result.tokensUsed > 0) {
             processedCount++;
             try {
                  await incrementAndLogTokenUsage(userId, result.tokensUsed);
                  console.log(`Incremented token usage for user ${userId} by ${result.tokensUsed}`);
             } catch (tokenError) {
                  console.error(`Failed to increment token usage for user ${userId} after processing file ${fileId}:`, tokenError);
                  // Don't mark the file processing as failed, but log the issue
             }
        } else if (result.status === 'error') {
             errorCount++;
        } else {
             processedCount++; // Count as processed even if no tokens were used (e.g., empty extraction)
        }
      } catch (dbUpdateError: unknown) { // Catch errors specifically from DB updates or other unexpected issues within the loop
        console.error(`Critical error during processing loop for file ${fileId}:`, dbUpdateError);
        errorCount++;
        // Attempt to mark the file as error in DB if something unexpected happened
        try {
            await db.update(uploadedFiles)
              .set({ status: 'error', error: `Processing Loop Error: ${dbUpdateError instanceof Error ? dbUpdateError.message : String(dbUpdateError)}`, updatedAt: new Date() })
              .where(eq(uploadedFiles.id, fileId));
        } catch (finalDbError) {
            console.error(`Failed even to mark file ${fileId} as error after critical loop failure:`, finalDbError);
        }
      }
    } // End loop through pending files

    return NextResponse.json({
      message: `Processing complete. Attempted: ${pendingFiles.length}, Succeeded: ${processedCount}, Errors: ${errorCount}`,
    });

  } catch (error: unknown) {
    console.error("Error in background processing job:", error);
    return NextResponse.json(
      { error: "Background processing job failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Add edge runtime if preferred for cron jobs
// export const runtime = 'edge'; 