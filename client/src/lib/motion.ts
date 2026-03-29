/** Mini Arcade – Motion (Framer Motion) configuration
 *  Shared animation constants for consistent, purposeful motion. */

export const durations = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  moderate: 0.3,
  slow: 0.4,
  slower: 0.5,
  leisurely: 0.8,
} as const

export const easings = {
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
}

export const spring = {
  default: { type: 'spring' as const, stiffness: 400, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  stiff: { type: 'spring' as const, stiffness: 500, damping: 35 },
  slow: { type: 'spring' as const, stiffness: 100, damping: 20 },
}

/* ── Variants ── */

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.moderate, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.normal },
  },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.moderate, ease: easings.easeOut },
  },
}

export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  tap: {
    scale: 0.98,
    transition: { duration: durations.instant },
  },
}

export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
}

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.normal } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
}

export const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: durations.normal },
  },
}
