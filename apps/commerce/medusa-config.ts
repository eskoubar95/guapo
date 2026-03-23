import { defineConfig } from "@medusajs/framework/utils";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Medusa Configuration for Guapo Commerce
 * 
 * Development: Works without Redis (uses in-memory modules)
 * Production: Requires Redis for event bus, workflow engine, caching, locking
 */

// Production guard: Ensure required env vars are present
if (process.env.NODE_ENV === "production") {
  const requiredEnvVars = {
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    COOKIE_SECRET: process.env.COOKIE_SECRET,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error("❌ Production environment requires the following environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease set these variables before starting the application in production.");
    process.exit(1);
  }
}

// Check if Redis is available
const useRedis = !!process.env.REDIS_URL;

// Build modules array based on environment
const modules: any[] = [];

// File storage: S3/Supabase when configured, else default local
if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET) {
  modules.push({
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [
        {
          resolve: '@medusajs/file-s3',
          id: 's3',
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || 'eu-west-3',
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            additional_client_config: {
              forcePathStyle: true,
            },
          },
        },
      ],
    },
  });
}

// Payment: Stripe (cards, Apple Pay, Google Pay; MobilePay/Klarna when enabled)
// Register only when STRIPE_API_KEY is set to avoid init errors when keys are missing
if (process.env.STRIPE_API_KEY) {
  modules.push({
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "./src/modules/payment-stripe-guapo",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            // Explicit payment_method_types per checkout (no automatic_payment_methods on PI)
            automatic_payment_methods: false,
          },
        },
      ],
    },
  });
}

// Fulfillment: manual (default) + Shipmondo (GLS/DAO pakkeshop, 39 DKK)
// Register when: API User+Key (for labels) OR Shipping Module Key (for dry-run + pickup points)
const hasShipmondoApi = !!(process.env.SHIPMONDO_API_USER && process.env.SHIPMONDO_API_KEY);
const hasShipmondoModuleKey = !!process.env.SHIPMONDO_SHIPPING_MODULE_KEY;
const fulfillmentProviders: { resolve: string; id: string; options?: Record<string, unknown> }[] = [
  { resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" },
];
if (hasShipmondoApi || hasShipmondoModuleKey) {
  fulfillmentProviders.push({
    resolve: "./src/modules/shipmondo",
    id: "shipmondo",
    options: {
      apiUser: process.env.SHIPMONDO_API_USER || "",
      apiKey: process.env.SHIPMONDO_API_KEY || "",
      sandbox: process.env.SHIPMONDO_SANDBOX === "true",
    },
  });
}
modules.push({
  resolve: "@medusajs/medusa/fulfillment",
  options: { providers: fulfillmentProviders },
});

modules.push(
  {
    resolve: "./src/modules/shipmondo-config",
  },
  {
    resolve: "./src/modules/brand",
  },
  {
    resolve: "./src/modules/subscription",
  },
  {
    resolve: "./src/modules/guapo-free-shipping",
  },
  {
    resolve: './src/modules/payload',
    options: {
      serverUrl: process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
      apiKey: process.env.PAYLOAD_API_KEY || '',
      userCollection: process.env.PAYLOAD_USER_COLLECTION || 'users',
      syncSecret: process.env.PAYLOAD_MEDUSA_SYNC_SECRET || undefined,
    },
  },
  {
    resolve: "@medusajs/medusa/auth",
    dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/auth-emailpass",
          id: "emailpass",
        },
        {
          resolve: "@medusajs/medusa/auth-google",
          id: "google",
          options: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL,
          },
        },
      ],
    },
  }
);

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
    databaseSchema: process.env.DATABASE_SCHEMA || "medusa",
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
    // In production, disable admin by default so server starts without admin build (e.g. Railway/Nixpacks).
    // Set DISABLE_MEDUSA_ADMIN=false when serving admin (e.g. Dockerfile build with .medusa).
    disable:
      process.env.NODE_ENV === "production"
        ? process.env.DISABLE_MEDUSA_ADMIN !== "false"
        : process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  plugins: [
    {
      resolve: "@lambdacurry/medusa-product-reviews",
      options: {
        defaultReviewStatus: "pending", // Pre-moderation per spec (on-site reviews)
      },
    },
  ],
  modules,
});
