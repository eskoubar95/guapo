import { defineConfig } from "@medusajs/framework/utils";

/**
 * Medusa Configuration for Guapo Commerce
 * 
 * Development: Works without Redis (uses in-memory modules)
 * Production: Requires Redis for event bus, workflow engine, caching, locking
 */

// Check if Redis is available
const useRedis = !!process.env.REDIS_URL;

// Build modules array based on environment
const modules: any[] = [];

if (useRedis) {
  // Production: Use Redis-based modules for scalability
  modules.push(
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        jobOptions: {
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 3600, count: 1000 },
        },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: { redisUrl: process.env.REDIS_URL },
      },
    }
  );
}
// Development without Redis: Medusa uses in-memory modules by default
// This is fine for local development but NOT for production

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseSchema: "medusa",
    redisUrl: process.env.REDIS_URL, // Optional in development
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret-jwt-for-dev",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret-cookie-for-dev",
    },
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules,
});
