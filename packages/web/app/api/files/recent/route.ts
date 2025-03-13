import { NextRequest, NextResponse } from 'next/server';
import { db, uploadedFiles } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query the database for the most recent files
    const recentFiles = await db
      .select({
        id: uploadedFiles.id,
        name: uploadedFiles.originalName,
        type: uploadedFiles.fileType,
        date: uploadedFiles.updatedAt,
        path: uploadedFiles.blobUrl,
      })
      .from(uploadedFiles)
      .orderBy(desc(uploadedFiles.updatedAt))
      .limit(10); // Get the 10 most recent files
    
    // Transform the data if needed
    const formattedFiles = recentFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type === 'pdf' ? 'file' : (file.type === 'image' ? 'image' : 'markdown'),
      date: file.date ? new Date(file.date).toISOString() : new Date().toISOString(),
      path: file.path || '',
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching recent files:', error);
    
    // Return empty array with error code
    return NextResponse.json([], { status: 500 });
  }
}
