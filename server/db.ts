import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
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

// Production-ready connection pool for high traffic events (100+ simultaneous users)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 100, // Support 100 simultaneous connections for event signups
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 15000, // 15 seconds to establish connection
  allowExitOnIdle: false, // Keep pool alive
});

// Database health status
let isHealthy = true;
let lastHealthCheck = Date.now();
let connectionErrors = 0;

// Add connection event handlers
pool.on('error', (err: any) => {
  console.error('❌ Database pool error:', err.message);
  connectionErrors++;
  isHealthy = false;
});

pool.on('connect', () => {
  if (connectionErrors > 0) {
    console.log('✅ Database reconnected after errors');
  }
  isHealthy = true;
  connectionErrors = 0;
});

// Health check function
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number; poolSize: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    lastHealthCheck = Date.now();
    isHealthy = true;
    return { 
      healthy: true, 
      latency,
      poolSize: pool.totalCount
    };
  } catch (error: any) {
    isHealthy = false;
    return { 
      healthy: false, 
      latency: Date.now() - start,
      poolSize: pool.totalCount
    };
  }
}

export function getDatabaseStatus() {
  return {
    isHealthy,
    lastHealthCheck,
    connectionErrors,
    poolStats: {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    }
  };
}

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