import { PrismaClient } from '@prisma/client'

declare global {
  var __miniArcadePrisma__: PrismaClient | undefined
}

const globalForPrisma = globalThis as typeof globalThis & {
  __miniArcadePrisma__?: PrismaClient
}

export const prisma =
  globalForPrisma.__miniArcadePrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__miniArcadePrisma__ = prisma
}

export * from '@prisma/client'
