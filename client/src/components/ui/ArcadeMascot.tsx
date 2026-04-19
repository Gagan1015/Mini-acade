'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/* ── Game data ──────────────────────────────────────────────── */

const GAMES = [
  { id: 'skribble', name: 'Skribble', sub: 'draw & guess', color: '#EC4899', darkSide: '#BE185D' },
  { id: 'trivia',   name: 'Trivia',   sub: 'quiz battle',  color: '#3B82F6', darkSide: '#1D4ED8' },
  { id: 'wordel',   name: 'Wordel',   sub: '5-letter hunt', color: '#10B981', darkSide: '#047857' },
  { id: 'flagel',   name: 'Flagel',   sub: '195+ flags',   color: '#F59E0B', darkSide: '#B45309' },
] as const

type Game = (typeof GAMES)[number]

/* ── Slot machine animation variants ────────────────────────── */

const slotVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  enter: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: {
    opacity: 0,
    y: -24,
    scale: 0.97,
    transition: { duration: 0.45, ease: [0.55, 0, 1, 0.45] },
  },
}

/* ── SVG icons rendered inside the tower SVG context ────────── */

function SlotIcon({ id, x, y }: { id: string; x: number; y: number }) {
  const s = { stroke: '#fff', strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'skribble':
      return (
        <g {...s}>
          <path d={`M${x+9},${y+1}l3,3-8,8h-3v-3z`} />
          <path d={`M${x+7.5},${y+2.5}l3,3`} />
        </g>
      )
    case 'trivia':
      return (
        <g {...s}>
          <path d={`M${x+3},${y+5}a4,4,0,1,1,8,0c0,2.5-2.5,2.5-2.5,4.5`} />
          <circle cx={x+7} cy={y+12.5} r={0.8} fill="#fff" stroke="none" />
        </g>
      )
    case 'wordel':
      return (
        <g stroke="#fff" strokeWidth={1.2} fill="rgba(255,255,255,0.15)" strokeLinecap="round">
          <rect x={x} y={y+1} width="5.5" height="5.5" rx="1" />
          <rect x={x+6.5} y={y+1} width="5.5" height="5.5" rx="1" fill="rgba(255,255,255,0.3)" />
          <rect x={x} y={y+7.5} width="5.5" height="5.5" rx="1" fill="rgba(255,255,255,0.08)" />
          <rect x={x+6.5} y={y+7.5} width="5.5" height="5.5" rx="1" />
        </g>
      )
    case 'flagel':
      return (
        <g {...s}>
          <line x1={x+2} y1={y} x2={x+2} y2={y+14} />
          <path d={`M${x+2},${y+1}c3-1,6,1,9,0v6c-3,1-6-1-9,0`} fill="rgba(255,255,255,0.3)" />
        </g>
      )
    default:
      return null
  }
}

/* ── Standalone SVG icons for floating HTML badges ──────────── */

function IconPencil({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4L7 21H3v-4z"/><path d="M14.5 5.5l4 4"/></svg>
}
function IconBulb({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-4 12.7V18h8v-3.3A7 7 0 0 0 12 2z"/><path d="M9 21h6"/></svg>
}
function IconGrid({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function IconFlag({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20"/><path d="M4 4c3-2 6-1 9 1s6 2 9 0v12c-3 2-6 1-9-1s-6-2-9 0"/></svg>
}

/* ── Geometry helpers ───────────────────────────────────────── */

function renderSlotContent(game: Game, y1: number, y2: number) {
  const centerY = (y1 + y2) / 2
  return (
    <>
      {/* Front face */}
      <path d={`M40,${y2} L260,${y2} L260,${y1} L40,${y1} Z`} fill={game.color} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
      {/* Right side face */}
      <path d={`M260,${y2} L310,${y2 - 25} L310,${y1 - 25} L260,${y1} Z`} fill={game.darkSide} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
      {/* Icon */}
      <SlotIcon id={game.id} x={48} y={centerY - 7} />
      {/* Name */}
      <text x={72} y={centerY + 4} fontSize="13" fontWeight="700" fill="#fff" fontFamily="'Space Grotesk',sans-serif">{game.name}</text>
      {/* Subtitle */}
      <text x={200} y={centerY + 4} fontSize="8" fontWeight="500" fill="rgba(255,255,255,0.7)" fontFamily="Inter,sans-serif">{game.sub}</text>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */

export function ArcadeMascot({ className = '' }: { className?: string }) {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCycle((c) => c + 1), 5000)
    return () => clearInterval(timer)
  }, [])

  const getGame = (slot: number) => GAMES[(slot + cycle) % GAMES.length]

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: 370, height: 480 }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full blur-[70px]"
        style={{ width: 240, height: 300, top: '14%', left: '10%', backgroundColor: 'var(--mascot-glow)' }}
        animate={{ scale: [0.94, 1.08, 0.94], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Floating chips (top-left & bottom-right) ── */}
      <motion.div
        className="absolute -left-6 top-16 z-20 rounded-full border border-[var(--border)] bg-[var(--mascot-chip-bg)] px-3 py-1 font-mono text-[10px] text-[var(--marketing-accent)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        sync 14ms
      </motion.div>
      <motion.div
        className="absolute -right-4 bottom-16 z-20 rounded-full border border-[var(--border)] bg-[var(--mascot-chip-bg)] px-3 py-1 font-mono text-[10px] text-[var(--text-secondary)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        room live
      </motion.div>

      {/* ═══════ ISOMETRIC TOWER ═══════ */}
      <motion.svg
        width="330"
        height="460"
        viewBox="0 0 330 460"
        fill="none"
        className="relative z-10"
        style={{ filter: 'drop-shadow(var(--mascot-shadow))' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF5A1F" /><stop offset="100%" stopColor="#E84D16" /></linearGradient>
          <linearGradient id="gAS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#D44215" /><stop offset="100%" stopColor="#B83A10" /></linearGradient>
          <linearGradient id="gSc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#1e293b" /></linearGradient>
          <pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="transparent" /><rect y="2" width="4" height="2" fill="rgba(0,0,0,0.05)" /></pattern>
          <pattern id="ig" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10 L10 0" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" /></pattern>
          <filter id="gl"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="sg"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="175" cy="452" rx="120" ry="10" fill="var(--mascot-shell-stroke)" opacity="0.06" />

        {/* ═══ BASE (410→438) ═══ */}
        <path d="M40,438 L260,438 L260,410 L40,410 Z" fill="var(--mascot-shell)" stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <path d="M260,438 L310,413 L310,385 L260,410 Z" fill="var(--mascot-shell)" fillOpacity={0.4} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <rect x="134" y="418" width="32" height="3" rx="1.5" fill="var(--mascot-screen)" opacity="0.25" />
        <rect x="139" y="424" width="22" height="8" rx="2" fill="var(--mascot-shell-panel)" stroke="var(--mascot-shell-stroke)" strokeWidth="0.7" />
        <motion.circle cx="244" cy="426" r="2.5" fill="#10B981" filter="url(#sg)" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        {[0,1,2].map(i => <g key={`sp${i}`}><rect x={56+i*12} y={420} width="8" height="1.5" rx=".75" fill="var(--mascot-shell-stroke)" opacity=".15"/><rect x={56+i*12} y={424} width="8" height="1.5" rx=".75" fill="var(--mascot-shell-stroke)" opacity=".15"/><rect x={56+i*12} y={428} width="8" height="1.5" rx=".75" fill="var(--mascot-shell-stroke)" opacity=".15"/></g>)}

        {/* ═══ SLOT 3 (374→410) ═══ */}
        <AnimatePresence initial={false}>
          <motion.g key={`s3-${getGame(3).id}`} custom={0.24} variants={slotVariants} initial="initial" animate="enter" exit="exit">
            {renderSlotContent(getGame(3), 374, 410)}
          </motion.g>
        </AnimatePresence>

        {/* ═══ SLOT 2 (338→374) ═══ */}
        <AnimatePresence initial={false}>
          <motion.g key={`s2-${getGame(2).id}`} custom={0.16} variants={slotVariants} initial="initial" animate="enter" exit="exit">
            {renderSlotContent(getGame(2), 338, 374)}
          </motion.g>
        </AnimatePresence>

        {/* ═══ SLOT 1 (302→338) ═══ */}
        <AnimatePresence initial={false}>
          <motion.g key={`s1-${getGame(1).id}`} custom={0.08} variants={slotVariants} initial="initial" animate="enter" exit="exit">
            {renderSlotContent(getGame(1), 302, 338)}
          </motion.g>
        </AnimatePresence>

        {/* ═══ MAIN PANEL (166→302) ═══ */}
        <path d="M40,302 L260,302 L260,166 L40,166 Z" fill="url(#gA)" stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <path d="M260,302 L310,277 L310,141 L260,166 Z" fill="url(#gAS)" stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <text x="150" y="228" textAnchor="middle" fontSize="38" fontWeight="700" fill="#fff" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.02em">Mini</text>
        <text x="150" y="272" textAnchor="middle" fontSize="38" fontWeight="700" fill="#fff" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.02em">Arcade</text>
        <rect x="210" y="173" width="40" height="16" rx="4" fill="rgba(255,255,255,0.16)" />
        <text x="218" y="184" fontSize="8" fontWeight="600" fill="#fff" fontFamily="Inter,sans-serif">▶ Play</text>

        {/* ═══ TOP SLOT (130→166) ═══ */}
        <AnimatePresence initial={false}>
          <motion.g key={`st-${getGame(0).id}`} custom={0} variants={slotVariants} initial="initial" animate="enter" exit="exit">
            {renderSlotContent(getGame(0), 130, 166)}
          </motion.g>
        </AnimatePresence>

        {/* ═══ SCREEN (68→130) ═══ */}
        <path d="M40,130 L260,130 L260,68 L40,68 Z" fill="var(--mascot-shell)" stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <path d="M260,130 L310,105 L310,43 L260,68 Z" fill="var(--mascot-shell)" fillOpacity={0.4} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <rect x="50" y="76" width="200" height="46" rx="7" fill="url(#gSc)" />
        <rect x="50" y="76" width="200" height="46" rx="7" fill="url(#sl)" />
        {/* ═══ FACE — changes with top slot game ═══ */}
        <AnimatePresence initial={false}>
          <motion.g
            key={`face-${getGame(0).id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {getGame(0).id === 'skribble' && (
              /* Skribble: playful wink + tongue out */
              <>
                <motion.circle cx="125" cy="96" r="6" fill="var(--mascot-eye)"
                  animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3, times: [0, 0.05, 0.1], repeat: Infinity, repeatDelay: 3 }} />
                {/* Winking right eye */}
                <motion.g
                  animate={{ y: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="M169 96 Q175 92 181 96" stroke="var(--mascot-eye)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </motion.g>
                <circle cx="110" cy="105" r="3.5" fill="#EC4899" opacity="0.4" />
                <circle cx="190" cy="105" r="3.5" fill="#EC4899" opacity="0.4" />
                {/* Playful smile */}
                <path d="M138 107 Q150 118 162 107" stroke="var(--mascot-eye)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </>
            )}
            {getGame(0).id === 'trivia' && (
              /* Trivia: curious thinking — one eye bigger, wavy mouth */
              <>
                <motion.g
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <circle cx="125" cy="95" r="7" fill="var(--mascot-eye)" />
                </motion.g>
                <circle cx="175" cy="97" r="5" fill="var(--mascot-eye)" />
                {/* Raised eyebrow */}
                <motion.g
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d="M116 86 Q125 82 134 86" stroke="var(--mascot-eye)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </motion.g>
                <circle cx="110" cy="105" r="3" fill="#3B82F6" opacity="0.3" />
                <circle cx="190" cy="105" r="3" fill="#3B82F6" opacity="0.3" />
                {/* Thinking mouth — wavy */}
                <motion.g
                  animate={{ y: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <path d="M140 109 Q145 106 150 109 Q155 112 160 109" stroke="var(--mascot-eye)" strokeWidth="2" strokeLinecap="round" fill="none" />
                </motion.g>
              </>
            )}
            {getGame(0).id === 'wordel' && (
              /* Wordel: focused determination — squinting eyes, flat mouth */
              <>
                <motion.ellipse cx="125" cy="96" rx="7" ry="3.5" fill="var(--mascot-eye)"
                  animate={{ ry: [3.5, 2.5, 3.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.ellipse cx="175" cy="96" rx="7" ry="3.5" fill="var(--mascot-eye)"
                  animate={{ ry: [3.5, 2.5, 3.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
                <circle cx="110" cy="105" r="3" fill="#10B981" opacity="0.3" />
                <circle cx="190" cy="105" r="3" fill="#10B981" opacity="0.3" />
                {/* Determined flat mouth */}
                <motion.g
                  animate={{ x: [0, -1, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <line x1="141" y1="109" x2="159" y2="109" stroke="var(--mascot-eye)" strokeWidth="2" strokeLinecap="round" />
                </motion.g>
              </>
            )}
            {getGame(0).id === 'flagel' && (
              /* Flagel: excited star-eyes — big smile */
              <>
                {/* Star eyes */}
                <motion.path d="M125 90 l2 4 4 0.5 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-0.5z" fill="var(--mascot-eye)"
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.path d="M175 90 l2 4 4 0.5 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-0.5z" fill="var(--mascot-eye)"
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
                <circle cx="110" cy="105" r="3.5" fill="#F59E0B" opacity="0.35" />
                <circle cx="190" cy="105" r="3.5" fill="#F59E0B" opacity="0.35" />
                {/* Wide excited grin */}
                <path d="M135 106 Q150 120 165 106" stroke="var(--mascot-eye)" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Sparkle accents */}
                <motion.circle cx="200" cy="85" r="1.5" fill="#F59E0B" opacity="0.6"
                  animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                <motion.circle cx="100" cy="88" r="1" fill="#F59E0B" opacity="0.5"
                  animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }} />
              </>
            )}
          </motion.g>
        </AnimatePresence>
        <motion.rect x="55" y="117" width="190" height="1.5" rx=".75" fill="#EC4899" opacity=".3" filter="url(#sg)"
          animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <motion.circle cx="55" cy="80" r="2" fill="var(--marketing-accent)" filter="url(#sg)"
          animate={{ opacity: [0.3, 0.85, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <motion.circle cx="245" cy="80" r="2" fill="var(--marketing-accent)" filter="url(#sg)"
          animate={{ opacity: [0.3, 0.85, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1.25 }} />

        {/* ═══ TOP CAP (52→68) ═══ */}
        <path d="M40,68 L260,68 L260,52 L40,52 Z" fill="var(--mascot-shell)" stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />
        <path d="M260,68 L310,43 L310,27 L260,52 Z" fill="var(--mascot-shell)" fillOpacity={0.4} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />

        {/* ═══ TOP FACE (y=52) ═══ */}
        <path d="M40,52 L90,27 L310,27 L260,52 Z" fill="var(--mascot-shell)" fillOpacity={0.6} stroke="var(--mascot-shell-stroke)" strokeWidth="1.5" />

        {/* Antenna */}
        <motion.g
          animate={{ x: [0, 5, 0], y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="175" y1="27" x2="175" y2="8" stroke="var(--mascot-shell-stroke)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="175" cy="8" r="4.5" fill="var(--marketing-accent)" filter="url(#gl)" />
        </motion.g>

        {/* Right side grid + vents */}
        <path d="M260,438 L310,413 L310,27 L260,52 Z" fill="url(#ig)" />
        {[0,1,2,3].map(i => <circle key={`v${i}`} cx={283} cy={320 + i * 12} r="1.5" fill="var(--mascot-shell-stroke)" opacity=".1" />)}
        {[0,1,2].map(i => <circle key={`w${i}`} cx={293} cy={326 + i * 12} r="1.5" fill="var(--mascot-shell-stroke)" opacity=".1" />)}
      </motion.svg>

      {/* ── Floating game icon badges (arranged symmetrically) ── */}
      {/* Top-right */}
      <motion.div className="absolute -right-6 top-24 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--mascot-chip-bg)] text-[var(--game-trivia)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, -5, 0], rotate: [0, -4, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}>
        <IconBulb />
      </motion.div>
      {/* Mid-left */}
      <motion.div className="absolute -left-5 top-[45%] z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--mascot-chip-bg)] text-[var(--game-skribble)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, 6, 0], rotate: [0, 4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
        <IconPencil />
      </motion.div>
      {/* Mid-right */}
      <motion.div className="absolute -right-5 top-[55%] z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--mascot-chip-bg)] text-[var(--game-flagel)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}>
        <IconFlag />
      </motion.div>
      {/* Bottom-left */}
      <motion.div className="absolute -left-4 bottom-24 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--mascot-chip-bg)] text-[var(--game-wordel)] shadow-[var(--marketing-shadow)] backdrop-blur-md"
        animate={{ y: [0, 5, 0], rotate: [0, -3, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}>
        <IconGrid />
      </motion.div>
    </div>
  )
}
