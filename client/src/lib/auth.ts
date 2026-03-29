import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@mini-arcade/db'
import type { DefaultSession, NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

type AppRole = NonNullable<DefaultSession['user']> & {
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
}

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true },
        })

        session.user.id = user.id
        session.user.role = dbUser?.role ?? 'USER'
        session.user.status = dbUser?.status ?? 'ACTIVE'
      }

      return session
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase()
      if (!email) {
        return
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: adminEmails.includes(email) ? 'ADMIN' : 'USER',
          status: 'ACTIVE',
        },
      })
    },
    async signIn({ user }) {
      const email = user.email?.toLowerCase()

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(email && adminEmails.includes(email) ? { role: 'ADMIN' } : {}),
        },
      })
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export type SessionUser = AppRole & {
  id: string
}
