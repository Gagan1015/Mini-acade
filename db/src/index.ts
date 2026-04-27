import { PrismaClient } from '@prisma/client'

declare global {
  var __arcadoPrisma__: PrismaClient | undefined
}

const globalForPrisma = globalThis as typeof globalThis & {
  __arcadoPrisma__?: PrismaClient
}

export const prisma =
  globalForPrisma.__arcadoPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__arcadoPrisma__ = prisma
}

export * from '@prisma/client'
