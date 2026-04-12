import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    reactStrictMode: true,
    // Keep dev and production artifacts separate so `next build`
    // never stomps on a running `next dev` server.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  }
}
