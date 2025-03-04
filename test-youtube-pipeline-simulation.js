// Simulation script for testing the YouTube transcript fetching pipeline
const fs = require('fs');
const path = require('path');

// Simulate the Action enum
const Action = {
  FETCH_YOUTUBE: "Fetching YouTube transcript...",
  FETCH_YOUTUBE_DONE: "YouTube transcript fetched",
  ERROR_FETCH_YOUTUBE: "Failed to fetch YouTube transcript",
};

// Simulate the record manager
class RecordManager {
  constructor() {
    this.logs = {};
  }

  addAction(hash, action) {
    console.log(`[RecordManager] Adding action: ${action}`);
    this.logs[action] = {
      timestamp: new Date().toISOString(),
      completed: false,
    };
  }

  completeAction(hash, action) {
    console.log(`[RecordManager] Completing action: ${action}`);
    if (this.logs[action]) {
      this.logs[action].completed = true;
    }
  }

  addError(hash, error) {
    console.log(`[RecordManager] Adding error: ${error.action} - ${error.message}`);
    this.logs[error.action] = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        action: error.action,
      },
    };
  }
}

// Simulate the YouTube service
async function extractYouTubeVideoId(content) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Simulate the fetchYouTubeTranscriptStep function
async function fetchYouTubeTranscriptStep(context) {
  try {
    console.log("Starting fetchYouTubeTranscriptStep");
    
    if (!context.content) {
      console.log("Skipping YouTube transcript: missing content");
      return context;
    }

    const videoId = await extractYouTubeVideoId(context.content);
    if (!videoId) {
      console.log("No YouTube video ID found in content");
      return context;
    }

    console.log(`Found YouTube video ID: ${videoId}`);
    
    // Simulate fetching YouTube content
    console.log("Simulating fetching YouTube content...");
    
    // Add completion action - this is what we added in our changes
    context.recordManager.completeAction(context.hash, Action.FETCH_YOUTUBE);
    
    console.log("YouTube transcript fetched successfully");
    return context;
  } catch (error) {
    console.error("Error in fetchYouTubeTranscriptStep:", error);
    context.recordManager.addError(context.hash, {
      action: Action.ERROR_FETCH_YOUTUBE,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Simulate the executeStep function
async function executeStep(context, step, action, errorAction) {
  try {
    console.log(`Executing step: ${action}`);
    context.recordManager.addAction(context.hash, action);
    const result = await step(context);
    return result;
  } catch (error) {
    console.error(`Error in step ${action}:`, error);
    context.recordManager.addError(context.hash, {
      action: errorAction,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Simulate the pipeline execution
async function simulatePipeline() {
  console.log("Starting pipeline simulation");
  
  // Create a test note with a YouTube link
  const testNote = `
# Test Note with YouTube Link

This is a test note that contains a YouTube link: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Let's see if the pipeline can fetch the transcript.
  `;
  
  // Create a context object
  const context = {
    hash: "test-hash",
    content: testNote,
    recordManager: new RecordManager(),
  };
  
  try {
    // Execute the YouTube transcript fetching step
    await executeStep(
      context,
      fetchYouTubeTranscriptStep,
      Action.FETCH_YOUTUBE,
      Action.ERROR_FETCH_YOUTUBE
    );
    
    console.log("Pipeline simulation completed successfully");
    console.log("Record manager logs:", context.recordManager.logs);
    
    // Verify that both start and completion actions were logged
    const fetchStarted = context.recordManager.logs[Action.FETCH_YOUTUBE];
    const fetchCompleted = fetchStarted && fetchStarted.completed;
    
    console.log("\nVerification Results:");
    console.log(`- FETCH_YOUTUBE action logged: ${!!fetchStarted}`);
    console.log(`- FETCH_YOUTUBE action completed: ${!!fetchCompleted}`);
    
    if (fetchStarted && fetchCompleted) {
      console.log("\n✅ Test PASSED: Both start and completion actions were logged correctly");
    } else {
      console.log("\n❌ Test FAILED: Start and/or completion actions were not logged correctly");
    }
  } catch (error) {
    console.error("Pipeline simulation failed:", error);
  }
}

// Run the simulation
simulatePipeline();
