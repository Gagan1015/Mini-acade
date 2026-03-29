'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

function LogoMarkSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={18} height={18} className="text-[var(--text-tertiary)]">
      <rect x="2" y="7" width="20" height="13" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="13.5" r="1.2" fill="currentColor" opacity="0.5" />
      <circle cx="16" cy="13.5" r="1.2" fill="currentColor" opacity="0.5" />
      <path d="M9 3.5V7M15 3.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-[var(--border)]/40"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5 text-[var(--text-tertiary)]">
            <LogoMarkSmall />
            <span className="text-sm font-medium tracking-tight">
              &copy; {new Date().getFullYear()} Mini Arcade
            </span>
          </div>
          <nav className="flex items-center gap-8 text-sm text-[var(--text-tertiary)]">
            <Link href="/" className="transition-colors duration-200 hover:text-[var(--text-secondary)]">
              Home
            </Link>
            <Link href="/lobby" className="transition-colors duration-200 hover:text-[var(--text-secondary)]">
              Lobby
            </Link>
            <a href="#" className="transition-colors duration-200 hover:text-[var(--text-secondary)]">
              Privacy
            </a>
            <a href="#" className="transition-colors duration-200 hover:text-[var(--text-secondary)]">
              Terms
            </a>
          </nav>
        </div>
      </div>
    </motion.footer>
  )
}
