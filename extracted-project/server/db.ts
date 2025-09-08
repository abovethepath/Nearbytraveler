import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon with more stable settings
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// More conservative connection pool settings to prevent connection issues
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduce max connections to prevent overwhelming
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 5000, // Longer connection timeout
  allowExitOnIdle: true,
});

// Add connection event handlers
pool.on('error', (err: any) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

export const db = drizzle({ client: pool, schema });

// Add connection wrapper with retry logic for critical operations
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || !error?.message?.includes('Too many database connection attempts')) {
        throw error;
      }
      // Wait exponentially longer between retries
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}