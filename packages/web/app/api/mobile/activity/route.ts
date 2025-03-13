import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query a database of mobile app events
    // For now, we'll try to generate realistic activity based on any available data
    
    const syncDir = process.env.SYNC_DIR || path.join(process.cwd(), 'sync_data');
    let mobileActivity = [];
    
    try {
      if (fs.existsSync(syncDir)) {
        // Get the most recent files to create activity items
        const allFiles = [];
        
        const getAllFiles = (dir: string) => {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
              getAllFiles(fullPath);
            } else if (item.isFile()) {
              const stats = fs.statSync(fullPath);
              allFiles.push({
                path: fullPath,
                name: item.name,
                mtime: stats.mtime,
                ext: path.extname(item.name).toLowerCase()
              });
            }
          }
        };
        
        getAllFiles(syncDir);
        
        // Sort by modification time (newest first)
        allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        
        // Take the 5 most recent files for activity
        const recentFiles = allFiles.slice(0, 5);
        
        // Create activity items based on these files
        mobileActivity = recentFiles.map(file => {
          const fileDate = file.mtime;
          
          // Format the timestamp in a human-readable way
          const formatTimeAgo = (date) => {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 0) {
              return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            } else if (diffHours > 0) {
              return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            } else if (diffMins > 0) {
              return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            } else {
              return 'Just now';
            }
          };
          
          // Determine activity type based on file extension
          let activityType = 'note';
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.ext)) {
            activityType = 'screenshot';
          }
          
          // Create timestamp representation
          const timestamp = fileDate.toLocaleString('en-US', {
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });
          
          // Create an activity object
          return {
            type: activityType,
            title: activityType === 'screenshot' ? 'Screenshot captured' : 'Note created',
            description: file.name,
            timestamp
          };
        });
        
        // Add a sync activity if we have files
        if (recentFiles.length > 0) {
          const mostRecentTime = recentFiles[0].mtime;
          const timestamp = mostRecentTime.toLocaleString('en-US', {
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });
          
          mobileActivity.unshift({
            type: 'sync',
            title: 'Sync completed',
            description: `${recentFiles.length} file${recentFiles.length > 1 ? 's' : ''} synced successfully`,
            timestamp
          });
        }
      }
    } catch (error) {
      console.error('Error fetching mobile activity:', error);
      // Fall back to mock data
    }
    
    // If no activity was found, return mock data
    if (mobileActivity.length === 0) {
      const now = new Date();
      
      // Create mock timestamps at different times
      const getTimeString = (minutesAgo) => {
        const time = new Date(now.getTime() - minutesAgo * 60000);
        return time.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      };
      
      mobileActivity = [
        {
          type: 'screenshot',
          title: 'Screenshot captured',
          description: 'dashboard-mockup.png',
          timestamp: getTimeString(30)
        },
        {
          type: 'note',
          title: 'Note created',
          description: 'meeting-notes.md',
          timestamp: getTimeString(90)
        },
        {
          type: 'sync',
          title: 'Sync completed',
          description: '3 files synced successfully',
          timestamp: getTimeString(120)
        }
      ];
    }
    
    return NextResponse.json(mobileActivity);
  } catch (error) {
    console.error('Error in mobile activity API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile activity' },
      { status: 500 }
    );
  }
}
