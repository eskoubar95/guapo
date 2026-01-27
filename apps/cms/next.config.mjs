import path from 'path'
import { fileURLToPath } from 'url'
import { withPayload } from '@payloadcms/next/withPayload'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload v3 is built as a Next.js app
  // Configure any additional Next.js options here
  experimental: {
    reactCompiler: false,
  },
  // Set the workspace root for monorepo setup
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
}

export default withPayload(nextConfig)
