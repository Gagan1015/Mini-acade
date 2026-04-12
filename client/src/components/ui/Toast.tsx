'use client'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { motion } from 'motion/react'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

const TOAST_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

const TOAST_STYLE = {
  success: {
    border: 'border-[var(--success-500)]/25',
    icon: 'text-[var(--success-500)]',
  },
  error: {
    border: 'border-[var(--error-500)]/25',
    icon: 'text-[var(--error-500)]',
  },
  info: {
    border: 'border-[var(--primary-500)]/25',
    icon: 'text-[var(--primary-400)]',
  },
} as const

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const Icon = TOAST_ICON[type]
  const style = TOAST_STYLE[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
      className={`fixed inset-x-4 bottom-4 z-[100] flex items-start gap-3 rounded-2xl border bg-[var(--surface)]/95 px-4 py-3 shadow-2xl backdrop-blur md:inset-x-auto md:right-6 md:w-[380px] ${style.border}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
      <p className="flex-1 text-sm leading-6 text-[var(--text-primary)]">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
