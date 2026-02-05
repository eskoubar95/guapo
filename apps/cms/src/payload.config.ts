import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
// S3 storage adapter for Supabase Storage (S3-compatible)
// import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Articles } from './collections/Articles'
import { ProductGuidance } from './collections/ProductGuidance'
import { Ingredients } from './collections/Ingredients'
import { Routines } from './collections/Routines'
import { Beneficials } from './collections/Beneficials'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Brands } from './collections/Brands'
import { ProductTypes } from './collections/ProductTypes'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'
import { Homepage } from './globals/Homepage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Media,
    Pages,
    Articles,
    ProductGuidance,
    Ingredients,
    Routines,
    Beneficials,
    Products,
    Categories,
    Brands,
    ProductTypes,
  ],

  globals: [Navigation, Footer, Homepage],

  editor: lexicalEditor(),

  secret: (() => {
    if (process.env.PAYLOAD_SECRET) return process.env.PAYLOAD_SECRET
    // Allow next build to complete (NODE_ENV=production); Payload may check process.env. Set it so build passes.
    if (process.env.NODE_ENV === 'production') {
      process.env.PAYLOAD_SECRET = 'build-placeholder-do-not-use-in-production'
      return process.env.PAYLOAD_SECRET
    }
    return 'DEV_SECRET_CHANGE_ME'
  })(),

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: (() => {
        const url = process.env.DATABASE_URL?.trim()
        if (!url) {
          if (process.env.NODE_ENV === 'production') {
            return ''
          }
          throw new Error(
            'DATABASE_URL is required. Copy apps/cms/env.template to apps/cms/.env and set DATABASE_URL to your Supabase Postgres connection string (Settings > Database). Payload uses schema "payload".',
          )
        }
        return url
      })(),
      // Supabase/Neon "Session mode" has low connection limit; Next.js can run multiple workers (each has a pool).
      max: Number(process.env.DATABASE_POOL_MAX) || 3,
      idleTimeoutMillis: 8000,
      connectionTimeoutMillis: 8000,
    },
    // Use dedicated schema to avoid conflicts with other services (Medusa)
    schemaName: 'payload',
    // Migration directory for version control
    migrationDir: path.resolve(dirname, '../migrations'),
  }),

  // Supabase Storage via S3 compatibility
  // Uncomment and configure when ready:
  // plugins: [
  //   s3Storage({
  //     collections: {
  //       media: true,
  //     },
  //     bucket: process.env.S3_BUCKET || 'media',
  //     config: {
  //       endpoint: process.env.S3_ENDPOINT,
  //       credentials: {
  //         accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  //         secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  //       },
  //       region: process.env.S3_REGION || 'auto',
  //       forcePathStyle: true, // Required for Supabase S3 compatibility
  //     },
  //   }),
  // ],
})
