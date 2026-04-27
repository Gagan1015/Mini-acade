/** @type {import('next').NextConfig} */
export default function nextConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    distDir: isDevelopment ? '.next-dev' : '.next',
    reactStrictMode: true,
    transpilePackages: ['@arcado/db', '@arcado/shared'],
  }
}
