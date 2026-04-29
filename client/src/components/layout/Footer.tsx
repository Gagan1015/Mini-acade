'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { LogoMark } from '@/components/ui/Logo'

interface FooterProps {
  variant?: 'default' | 'marketing'
}

export function Footer({ variant = 'default' }: FooterProps) {
  const isMarketing = variant === 'marketing'

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`${isMarketing ? 'marketing-rail-layout' : ''} border-t border-[var(--border)]`}
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className={`flex flex-col gap-8 ${isMarketing ? 'lg:flex-row lg:items-end lg:justify-between' : 'md:flex-row md:items-center md:justify-between'}`}>
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 text-[var(--text-tertiary)]">
              <LogoMark size={18} />
              <span className="text-sm font-medium tracking-tight">
                &copy; {new Date().getFullYear()} Arcado
              </span>
            </div>
            {isMarketing && (
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                Multiplayer rooms that feel organized before the first round starts.
                Share a code, rally your crew, and move from lobby to match in seconds.
              </p>
            )}
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-[var(--text-tertiary)]">
            <Link href="/" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
              Home
            </Link>
            <Link href="/lobby" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
              Lobby
            </Link>
            {isMarketing && (
              <>
                <Link href="/#games" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
                  Games
                </Link>
                <Link href="/#how-it-works" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
                  How It Works
                </Link>
              </>
            )}
            <Link href="/privacy" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-[var(--text-primary)]">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </motion.footer>
  )
}
