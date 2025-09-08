// Production server entry point that doesn't require TypeScript compilation
// This file runs the TypeScript server directly using tsx in production

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting production server...');

// Run the TypeScript server directly with tsx
const serverProcess = spawn('npx', ['tsx', path.join(__dirname, 'index.ts')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  }
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  serverProcess.kill('SIGINT');
});