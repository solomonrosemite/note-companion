// Test script to simulate the YouTube transcript fetching pipeline
const fs = require('fs');
const path = require('path');

// Create a test note with a YouTube link
const testNote = `
# Test Note with YouTube Link

This is a test note that contains a YouTube link: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Let's see if the pipeline can fetch the transcript.
`;

// Save the test note to a file
const testNotePath = path.join(__dirname, 'test-note-with-youtube.md');
fs.writeFileSync(testNotePath, testNote);

console.log(`Created test note at ${testNotePath}`);
console.log('To test the pipeline:');
console.log('1. Build the plugin: cd packages/plugin && pnpm build');
console.log('2. Install the plugin in Obsidian');
console.log('3. Move the test note to the inbox folder in Obsidian');
console.log('4. Check the logs to verify that both start and completion messages appear correctly');
