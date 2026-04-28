import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
export default function nextConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    distDir: isDevelopment ? '.next-dev' : '.next',
    reactStrictMode: true,
    transpilePackages: ['@arcado/db', '@arcado/shared'],

    // `standalone` produces a self-contained server bundle in
    // `.next/standalone` that we copy into the Docker runtime image.
    // `experimental.outputFileTracingRoot` points file tracing at the
    // monorepo root so workspace dependencies (@arcado/db, @arcado/shared,
    // prisma client) get pulled into the standalone bundle.
    // (Note: Next 15 promotes this to a top-level option; we're on 14.2.)
    output: isDevelopment ? undefined : 'standalone',
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '..'),
    },
  }
}
