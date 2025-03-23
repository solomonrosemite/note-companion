import { NextRequest, NextResponse } from "next/server";
import { db, uploadedFiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { Mistral } from "@mistralai/mistralai";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { OpenAI } from "openai";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { handleAuthorizationV2 } from "@/lib/handleAuthorization";

export const maxDuration = 60; // 1 minute (maximum allowed for hobby plan)

// Define custom error type
interface ProcessingError {
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
}

interface OCRImage {
  url?: string;
  data?: string;
  type?: string;
}

interface OCRPage {
  index: number;
  markdown: string;
  images: OCRImage[];
  dimensions: {
    dpi: number;
    height: number;
    width: number;
  };
}

interface OCRResponse {
  pages?: OCRPage[];
  data?: {
    text?: string;
    content?: string;
    markdown?: string;
  };
  text?: string;
  content?: string;
  markdown?: string;
  items?: Array<{ text?: string }>;
  usage?: {
    total_tokens?: number;
    totalTokens?: number;
  };
  rawResponse?: unknown;
  fullResponse?: unknown;
}

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
    console.log(
      `Compressing image of type ${fileType} and size ${buffer.length} bytes`
    );

    // Determine the format based on the fileType
    let format: string;
    if (fileType === "image/jpeg" || fileType === "image/jpg") {
      format = "jpeg";
    } else if (fileType === "image/png") {
      format = "png";
    } else if (fileType === "image/webp") {
      format = "webp";
    } else if (fileType === "image/gif") {
      format = "gif";
    } else if (fileType === "image/tiff") {
      format = "tiff";
    } else {
      // Default to jpeg for other image types
      format = "jpeg";
    }

    // Optimize the image
    // - Use jpeg with quality 85 for photographs (good balance of quality and size)
    // - Use png for screenshots or diagrams (maintains text quality)
    // - Resize very large images to reasonable dimensions
    let processedImage = sharp(buffer);

    // Get image metadata to check dimensions
    const metadata = await processedImage.metadata();

    // If image is extremely large, resize it to reasonable dimensions
    // This helps with OCR performance and reduces upload size
    const MAX_DIMENSION = 3000; // Maximum width or height
    if (
      (metadata.width && metadata.width > MAX_DIMENSION) ||
      (metadata.height && metadata.height > MAX_DIMENSION)
    ) {
      console.log(
        `Resizing large image from ${metadata.width}x${metadata.height}`
      );
      processedImage = processedImage.resize({
        width:
          metadata.width && metadata.width > MAX_DIMENSION
            ? MAX_DIMENSION
            : undefined,
        height:
          metadata.height && metadata.height > MAX_DIMENSION
            ? MAX_DIMENSION
            : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Optimize based on format
    if (format === "jpeg") {
      processedImage = processedImage.jpeg({ quality: 85, mozjpeg: true });
    } else if (format === "png") {
      processedImage = processedImage.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
    } else if (format === "webp") {
      processedImage = processedImage.webp({ quality: 85 });
    } else {
      // For other formats, just resize without changing format
      processedImage = processedImage.rotate(); // No-op transform to maintain the pipeline
    }

    // Convert to buffer
    const compressedBuffer = await processedImage.toBuffer();

    console.log(
      `Compressed image from ${buffer.length} to ${
        compressedBuffer.length
      } bytes (${Math.round((compressedBuffer.length / buffer.length) * 100)}%)`
    );

    return compressedBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original buffer if compression fails
    return buffer;
  }
}

// Helper function to extract text from OCR response
function extractTextFromOCRResponse(ocrResponse: OCRResponse): {
  textContent: string;
  tokensUsed: number;
} {
  try {
    console.log("Extracting text from OCR response");

    let textContent = "";
    let tokensUsed = 0;

    // Check if the response has a pages array
    if (Array.isArray(ocrResponse.pages)) {
      console.log("Found pages array in OCR response");
      textContent = ocrResponse.pages
        .map((page: OCRPage) => page.markdown || "")
        .join("\n\n");
    }
    // Check if the response has a text field
    else if (ocrResponse.data?.text) {
      console.log("Found text in OCR response.data.text");
      textContent = ocrResponse.data.text;
    }
    // Check if the response has a content field
    else if (ocrResponse.data?.content) {
      console.log("Found text in OCR response.data.content");
      textContent = ocrResponse.data.content;
    }
    // Check if the response has a markdown field
    else if (ocrResponse.data?.markdown) {
      console.log("Found text in OCR response.data.markdown");
      textContent = ocrResponse.data.markdown;
    }
    // Check for direct properties
    else if (ocrResponse.text) {
      console.log("Found text in OCR response.text");
      textContent = ocrResponse.text;
    } else if (ocrResponse.content) {
      console.log("Found text in OCR response.content");
      textContent = ocrResponse.content;
    } else if (ocrResponse.markdown) {
      console.log("Found text in OCR response.markdown");
      textContent = ocrResponse.markdown;
    }
    // Check for nested items
    else if (Array.isArray(ocrResponse.items)) {
      console.log("Found items array in OCR response");
      textContent = ocrResponse.items.map((item) => item.text || "").join(" ");
    }
    // Fallback: stringify the entire response (excluding large nested objects)
    else {
      console.log(
        "No recognized text fields found in OCR response, using fallback"
      );
      // Create a safe version of the response for stringification
      const safeResponse = { ...ocrResponse };
      // Remove potentially large or circular properties
      delete safeResponse.rawResponse;
      delete safeResponse.fullResponse;

      textContent = `OCR Response: ${JSON.stringify(safeResponse)}`;
    }

    // Extract token usage if available
    if (ocrResponse.usage) {
      if (typeof ocrResponse.usage.total_tokens === "number") {
        tokensUsed = ocrResponse.usage.total_tokens;
        console.log(`Found token usage in total_tokens: ${tokensUsed}`);
      } else if (typeof ocrResponse.usage.totalTokens === "number") {
        tokensUsed = ocrResponse.usage.totalTokens;
        console.log(`Found token usage in totalTokens: ${tokensUsed}`);
      } else {
        // Attempt to estimate tokens based on text length
        tokensUsed = Math.ceil(textContent.length / 4);
        console.log(
          `Estimated token usage based on text length: ${tokensUsed}`
        );
      }
    } else {
      // Estimate tokens if usage info isn't available
      tokensUsed = Math.ceil(textContent.length / 4);
      console.log(`No usage info found, estimated token usage: ${tokensUsed}`);
    }

    return {
      textContent,
      tokensUsed,
    };
  } catch (error) {
    console.error("Error extracting text from OCR response:", error);
    return {
      textContent: `Error extracting text from OCR response: ${
        error instanceof Error ? error.message : String(error)
      }`,
      tokensUsed: 0,
    };
  }
}

// Helper function to process image with GPT-4o
async function processImageWithGPT4o(
  imageUrl: string
): Promise<{ textContent: string; tokensUsed: number }> {
  try {
    console.log("Processing image with GPT-4o...");

    // Call the vision API with GPT-4o
    // use generateObject from vercel ai sdk

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        markdown: z.string(),
      }),
      messages: [
        {
          role: "system",
          content:
            "Extract all text from this image. Be comprehensive and maintain original formatting where possible.",
        },
        {
          role: "user",
          content: [{ type: "image", image: imageUrl }],
        },
      ],
    });

    // Extract the text content and token usage information
    const textContent = object.markdown || "";
    const tokensUsed = 0;

    console.log(
      `GPT-4o extracted ${textContent.length} characters, used ${tokensUsed} tokens`
    );

    return {
      textContent,
      tokensUsed,
    };
  } catch (error) {
    console.error("Error processing image with GPT-4o:", error);
    return {
      textContent: `Error processing image with GPT-4o: ${
        error instanceof Error ? error.message : String(error)
      }`,
      tokensUsed: 0,
    };
  }
}

export async function POST(request: NextRequest) {
  let tokensUsed = 0;
  let textContent = "";
  // We declare embeddings here but only use it in the database update
  // (kept for future implementation of embedding generation)
  const embeddings: number[] = []; // This will be used in the future for embeddings
  let queryFileId: number | string | null = null;
  let uploadedImage: {
    id: string;
    filename: string;
    createdAt: string;
  } | null = null;
  let signedUrl: { url: string } | null = null;

  try {
    // Check authentication first using the V2 authorization handler
    console.log("API: Received request to process file");
    
    let userId;
    try {
      const authResult = await handleAuthorizationV2(request);
      userId = authResult.userId;
    } catch (authError: unknown) {
      console.error("Authorization error:", authError);
      // Type guard to safely extract error properties
      const status = authError && typeof authError === 'object' && 'status' in authError 
        ? (authError.status as number) 
        : 401;
      
      const message = authError && typeof authError === 'object' && 'message' in authError
        ? String(authError.message)
        : "Unauthorized";
        
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
    
    const authHeader = request.headers.get("authorization");
    const payload = (await request.json()) as { fileId: number | string };
    queryFileId = payload.fileId;

    // Log the received fileId for debugging
    console.log("Processing file ID:", queryFileId);

    // Handle API key auth from mobile app - this is now handled in handleAuthorizationV2
    if (!userId) {
      console.error("Unauthorized process attempt - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Regular web authentication flow
    if (!queryFileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Convert fileId to number if possible for database query
    let queryFileIdNumber: number;
    try {
      if (typeof queryFileId === "string" && queryFileId.startsWith("text-")) {
        console.log(
          "Mobile text ID detected, querying using string ID:",
          queryFileId
        );
        // Need to query by string ID for mobile app-generated IDs
        // Check if we have the mobile text ID in our database
        const [fileRecord] = await db
          .select()
          .from(uploadedFiles)
          .where(eq(uploadedFiles.originalName, queryFileId))
          .limit(1);

        if (!fileRecord) {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }

        // Use the numeric ID from the database for subsequent operations
        queryFileIdNumber = fileRecord.id;
      } else {
        // Try to convert to number for standard fileIds
        queryFileIdNumber = Number(queryFileId);

        if (isNaN(queryFileIdNumber)) {
          return NextResponse.json(
            { error: "Invalid file ID format" },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.error("Error converting fileId:", error);
      return NextResponse.json(
        { error: "Invalid file ID format" },
        { status: 400 }
      );
    }

    console.log(
      "Using queryFileId for database operations:",
      queryFileIdNumber
    );

    // Get file record
    const [fileRecord] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, queryFileIdNumber))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (fileRecord.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update status to processing
    await db
      .update(uploadedFiles)
      .set({ status: "processing" })
      .where(eq(uploadedFiles.id, queryFileIdNumber));

    // Get file from Blob storage
    const response = await fetch(fileRecord.blobUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch file from storage");
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize Mistral client
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("Mistral API key is not configured");
    }
    const mistralClient = new Mistral({ apiKey });

    // Determine file type and handling approach
    const fileType = fileRecord.fileType.toLowerCase();
    let uploadedFile: { id: string } | null = null;
    signedUrl = null;

    try {
      if (fileType === "application/pdf" || fileType.includes("pdf")) {
        console.log("Processing PDF file with Mistral OCR");

        try {
          // Upload the PDF file to Mistral
          uploadedFile = await (
            mistralClient.files.upload as unknown as (
              // Ignore the parameter name since we're not using it
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              _: {
                file: { fileName: string; content: Buffer };
                purpose: string;
              }
            ) => Promise<{ id: string; filename: string; createdAt: string }>
          )({
            file: {
              fileName:
                fileRecord.originalName || `pdf-${queryFileIdNumber}.pdf`,
              content: buffer,
            },
            purpose: "ocr",
          });

          console.log("Uploaded PDF file to Mistral:", uploadedFile.id);

          // Get signed URL for the uploaded file
          signedUrl = await mistralClient.files.getSignedUrl({
            fileId: uploadedFile.id,
          });

          // Run OCR on the PDF using the signed URL
          const ocrResponse = await (
            mistralClient.ocr.process as unknown as (
              // Ignore the parameter name since we're not using it
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              _: {
                model: string;
                document: {
                  type: string;
                  documentUrl: string;
                };
              }
            ) => Promise<Record<string, unknown>>
          )({
            model: "mistral-ocr-latest",
            document: {
              type: "document_url",
              documentUrl: signedUrl.url,
            },
          });

          console.log("OCR processing complete, extracting text content");
          console.log(
            "OCR response structure:",
            JSON.stringify(ocrResponse, null, 2).substring(0, 500) + "..."
          );

          // Extract text content from OCR response
          const extractedContent = extractTextFromOCRResponse(
            ocrResponse as OCRResponse
          );
          textContent = extractedContent.textContent;
          tokensUsed = extractedContent.tokensUsed;

          console.log(
            `Extracted ${textContent.length} characters, used ${tokensUsed} tokens`
          );
        } catch (ocrError) {
          console.error("Error in PDF OCR processing:", ocrError);
          textContent = `Error processing PDF: ${
            ocrError instanceof Error ? ocrError.message : String(ocrError)
          }`;
        }
      } else {
        // For images, compress first if needed
        const processedBuffer = await compressImage(buffer, fileType);

        // For images, use GPT-4o for better OCR
        console.log("Processing image file with GPT-4o vision capabilities");

        try {
          // Check if we already have a blob URL from the uploaded file
          if (fileRecord.blobUrl) {
            const imageUrl = fileRecord.blobUrl;
            console.log(
              "Using existing blob URL for image:",
              imageUrl.substring(0, 50) + "..."
            );

            // Use GPT-4o to process the image
            const extractedContent = await processImageWithGPT4o(imageUrl);
            textContent = extractedContent.textContent;
            tokensUsed = extractedContent.tokensUsed;
          } else {
            // If no blob URL exists, we need to create a temporary one or upload the image
            // This is a fallback case - we should almost always have a blob URL
            console.log(
              "No blob URL available for image, falling back to Mistral OCR"
            );

            // Use a type assertion to work around SDK limitations
            uploadedImage = await (
              mistralClient.files.upload as unknown as (
                // Ignore the parameter name since we're not using it
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _: {
                  file: { fileName: string; content: Buffer };
                  purpose: string;
                }
              ) => Promise<{ id: string; filename: string; createdAt: string }>
            )({
              file: {
                fileName:
                  fileRecord.originalName || `image-${queryFileIdNumber}.jpg`,
                content: processedBuffer,
              },
              purpose: "ocr",
            });

            console.log("Uploaded image file to Mistral:", uploadedImage.id);

            // Get signed URL for the uploaded image
            signedUrl = await mistralClient.files.getSignedUrl({
              fileId: uploadedImage.id,
            });

            const mistralImageUrl = signedUrl.url;
            console.log(
              "Got signed URL for image:",
              mistralImageUrl.substring(0, 50) + "..."
            );

            // Use the Mistral API as fallback
            const ocrResponse = await mistralClient.ocr.process({
              model: "mistral-ocr-latest",
              document: {
                type: "image_url",
                imageUrl: mistralImageUrl,
              },
            });

            console.log("OCR processing complete, extracting text content");

            // Use the helper function to extract text content
            const extractedContent = extractTextFromOCRResponse(
              ocrResponse as OCRResponse
            );
            textContent = extractedContent.textContent;
            tokensUsed = extractedContent.tokensUsed;

            // Post-process the text to clean it up
            if (textContent) {
              // Remove excessive whitespace
              textContent = textContent.replace(/\s+/g, " ").trim();

              // Fix common OCR errors
              textContent = textContent
                .replace(/(\w)-\s+(\w)/g, "$1$2") // Fix hyphenated words that shouldn't be
                .replace(/(\d),(\d)/g, "$1.$2") // Fix commas that should be decimal points in numbers
                .replace(/(\d)\.(\d{3})/g, "$1,$2"); // Fix decimal points that should be commas in numbers

              console.log(
                "Post-processed text, final length:",
                textContent.length
              );
            }
          }

          // Post-process the text to clean it up
          if (textContent) {
            // Remove excessive whitespace
            textContent = textContent.replace(/\s+/g, " ").trim();

            // Fix common OCR errors
            textContent = textContent
              .replace(/(\w)-\s+(\w)/g, "$1$2") // Fix hyphenated words that shouldn't be
              .replace(/(\d),(\d)/g, "$1.$2") // Fix commas that should be decimal points in numbers
              .replace(/(\d)\.(\d{3})/g, "$1,$2"); // Fix decimal points that should be commas in numbers

            console.log(
              "Post-processed text, final length:",
              textContent.length
            );
          }
        } catch (ocrError: unknown) {
          console.error("OCR processing error:", ocrError);

          const errorMessage =
            typeof ocrError === "object" &&
            ocrError !== null &&
            "message" in ocrError
              ? String(ocrError.message)
              : String(ocrError);

          textContent = `Error processing image with OCR: ${errorMessage}`;
          tokensUsed = 0;
        }
      }
    } catch (ocrError: unknown) {
      const error = ocrError as ProcessingError;
      console.error("Error during OCR processing:", error);

      // Update file status to error
      await db
        .update(uploadedFiles)
        .set({
          status: "error",
          error: error.message || "OCR processing failed",
          updatedAt: new Date(),
        })
        .where(eq(uploadedFiles.id, queryFileIdNumber));

      throw error; // Rethrow to be caught by the outer try-catch
    }

    // Final check to ensure we have text content
    if (!textContent || textContent.trim() === "") {
      console.warn("No text content was extracted, using fallback placeholder");
      textContent =
        "⚠️ OCR processing completed, but no text could be extracted from this document.";
    }

    // Update database with results
    await db
      .update(uploadedFiles)
      .set({
        status: "completed",
        textContent: textContent,
        tokensUsed: tokensUsed,
        updatedAt: new Date(),
      })
      .where(eq(uploadedFiles.id, queryFileIdNumber));

    // Update user's token usage
    console.log("Incrementing token usage for user:", userId, tokensUsed);
    try {
      const usageResult = await incrementAndLogTokenUsage(userId, tokensUsed);
      
      // Check if user has reached token limit
      if (usageResult.needsUpgrade) {
        console.log(`User ${userId} has reached their token limit`);
        // We still return success for this request since the file was processed
        return NextResponse.json({
          success: true,
          text: textContent,
          needsUpgrade: true,
          remainingTokens: usageResult.remaining,
        });
      }
    } catch (error) {
      console.error("Error updating token usage:", error);
      // Continue processing - don't fail the request if token tracking fails
    }

    return NextResponse.json({
      success: true,
      text: textContent,
    });
  } catch (error: unknown) {
    const err = error as ProcessingError;
    console.error("Processing error:", err);

    // Update file status to error if we have a fileId
    if (queryFileId !== null) {
      try {
        // For error handling, we need to be more careful with the ID
        // since queryFileId might not be defined yet
        let errorQueryFileId: number;

        try {
          // Try to parse the fileId to a number for the database operation
          if (
            typeof queryFileId === "string" &&
            queryFileId.startsWith("text-")
          ) {
            // We won't try to look up by originalName here as that might fail again
            console.log("Cannot update error status for text ID:", queryFileId);
            throw new Error("Cannot update text ID status");
          } else {
            errorQueryFileId = Number(queryFileId);
            if (isNaN(errorQueryFileId)) {
              throw new Error("Invalid file ID for error status update");
            }
          }

          // Only update if we have a valid numeric ID
          await db
            .update(uploadedFiles)
            .set({
              status: "error",
              error: err.message,
              updatedAt: new Date(),
            })
            .where(eq(uploadedFiles.id, errorQueryFileId));
        } catch (updateError) {
          // Log error but don't fail if we can't update status
          console.error("Could not update error status in DB:", updateError);
        }
      } catch (updateError) {
        // Log error but don't fail if we can't update status
        console.error("Could not update error status in DB:", updateError);
      }
    }

    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
