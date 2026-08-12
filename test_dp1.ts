import { readFileSync } from 'fs';

// Mock DB
const db = JSON.parse(readFileSync('data.json', 'utf8'));

// Extract function directly from server.ts and run it!
// Let's just run it via esbuild to be quick.
