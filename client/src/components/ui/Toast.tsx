'use client'

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

/* ── Types ── */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

/* ── Style config ── */

const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: typeof CheckCircle2
    accentColor: string
    bgTint: string
    borderColor: string
    iconColor: string
  }
> = {
  success: {
    icon: CheckCircle2,
    accentColor: 'var(--success-500)',
    bgTint: 'rgba(34, 197, 94, 0.06)',
    borderColor: 'rgba(34, 197, 94, 0.18)',
    iconColor: 'var(--success-500)',
  },
  error: {
    icon: AlertCircle,
    accentColor: 'var(--error-500)',
    bgTint: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.18)',
    iconColor: 'var(--error-500)',
  },
  warning: {
    icon: AlertTriangle,
    accentColor: 'var(--warning-500)',
    bgTint: 'rgba(234, 179, 8, 0.06)',
    borderColor: 'rgba(234, 179, 8, 0.18)',
    iconColor: 'var(--warning-500)',
  },
  info: {
    icon: Info,
    accentColor: 'var(--primary-500)',
    bgTint: 'rgba(59, 130, 246, 0.06)',
    borderColor: 'rgba(59, 130, 246, 0.18)',
    iconColor: 'var(--primary-400)',
  },
}

const DEFAULT_DURATION = 4000
const MAX_TOASTS = 5

/* ── Context ── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

/* ── Single toast item ── */

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const config = TOAST_CONFIG[item.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.92, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 380, damping: 26 },
      }}
      exit={{
        opacity: 0,
        x: 80,
        scale: 0.92,
        filter: 'blur(4px)',
        transition: { duration: 0.22, ease: 'easeIn' },
      }}
      role="status"
      aria-live="polite"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '16px',
        border: `1px solid ${config.borderColor}`,
        background: 'var(--surface)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        boxShadow:
          '0 8px 32px -4px rgba(0, 0, 0, 0.35), 0 2px 8px -2px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        maxWidth: '420px',
        width: '100%',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          borderRadius: '16px 0 0 16px',
          background: config.accentColor,
        }}
      />

      {/* Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: config.bgTint,
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <Icon
          style={{
            width: '16px',
            height: '16px',
            color: config.iconColor,
          }}
        />
      </div>

      {/* Message */}
      <p
        style={{
          flex: 1,
          fontSize: '0.84rem',
          fontWeight: 500,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
          margin: 0,
          paddingTop: '5px',
        }}
      >
        {item.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          transition: 'color 0.15s, background 0.15s',
          flexShrink: 0,
          marginTop: '3px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.background = 'var(--surface-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: item.duration / 1000, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: '3px',
          right: 0,
          bottom: 0,
          height: '2px',
          background: config.accentColor,
          transformOrigin: 'left',
          opacity: 0.5,
          borderRadius: '0 0 16px 0',
        }}
      />
    </motion.div>
  )
}

/* ── Provider ── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)
  const prefix = useId()

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION) => {
      counterRef.current += 1
      const id = `${prefix}-toast-${counterRef.current}`

      setToasts((prev) => {
        const next = [...prev, { id, message, type, duration }]
        // Keep only the latest MAX_TOASTS
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next
      })

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss, prefix],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      success: (msg, dur) => addToast(msg, 'success', dur),
      error: (msg, dur) => addToast(msg, 'error', dur),
      info: (msg, dur) => addToast(msg, 'info', dur),
      warning: (msg, dur) => addToast(msg, 'warning', dur),
      dismiss,
      dismissAll,
    }),
    [addToast, dismiss, dismissAll],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <div key={item.id} style={{ pointerEvents: 'auto' }}>
              <ToastCard item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/* ── Legacy named export for backwards-compat with RoomLobby ── */

type LegacyToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: LegacyToastProps) {
  const config = TOAST_CONFIG[type]
  const Icon = config.icon

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
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '16px',
        border: `1px solid ${config.borderColor}`,
        background: 'var(--surface)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        boxShadow:
          '0 8px 32px -4px rgba(0, 0, 0, 0.35), 0 2px 8px -2px rgba(0, 0, 0, 0.2)',
        maxWidth: '420px',
        width: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          borderRadius: '16px 0 0 16px',
          background: config.accentColor,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: config.bgTint,
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: '16px', height: '16px', color: config.iconColor }} />
      </div>
      <p
        style={{
          flex: 1,
          fontSize: '0.84rem',
          fontWeight: 500,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
          margin: 0,
          paddingTop: '5px',
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          marginTop: '3px',
        }}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </motion.div>
  )
}
