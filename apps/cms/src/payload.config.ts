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

  collections: [Users, Media, Pages, Articles, ProductGuidance],

  globals: [Navigation, Footer, Homepage],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYLOAD_SECRET environment variable is required in production')
    }
    return 'DEV_SECRET_CHANGE_ME'
  })(),

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
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
