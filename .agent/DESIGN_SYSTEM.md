# Mini Arcade Design System

## Overview
This document defines the visual language, design tokens, and component guidelines for the Mini Arcade platform. The design follows a modern, clean aesthetic with support for both dark and light themes.

**Design Philosophy:**
- Clean and uncluttered interfaces
- Consistent spacing and typography
- Subtle depth through borders and shadows (not heavy drop shadows)
- Tasteful rounded corners (not too sharp, not too pill-shaped)
- Professional yet playful (it's a game platform)

---

## Color System

### Light Theme

```css
/* Base Colors */
--background:         #F7F9FC;    /* NOT pure white - soft blue-gray tint */
--background-subtle:  #EEF1F6;    /* Slightly darker for contrast */
--surface:            #FFFFFF;    /* Cards, modals, elevated surfaces */
--surface-hover:      #F0F3F8;    /* Hover state for surfaces */
--surface-active:     #E8ECF3;    /* Active/pressed state */

/* Borders */
--border:             #E2E6EE;    /* Default borders */
--border-subtle:      #EBEEF4;    /* Subtle dividers */
--border-strong:      #D1D7E3;    /* Emphasized borders */

/* Text Colors */
--text-primary:       #0F172A;    /* Headings, primary text */
--text-secondary:     #475569;    /* Body text, descriptions */
--text-tertiary:      #94A3B8;    /* Placeholder, disabled, hints */
--text-inverse:       #FFFFFF;    /* Text on dark/colored backgrounds */

/* Sidebar (stays dark in light mode for contrast) */
--sidebar-bg:         #0F172A;    /* Dark sidebar background */
--sidebar-text:       #E2E8F0;    /* Sidebar text */
--sidebar-text-muted: #94A3B8;    /* Sidebar secondary text */
--sidebar-hover:      #1E293B;    /* Sidebar item hover */
--sidebar-active:     #334155;    /* Sidebar active item */
--sidebar-border:     #1E293B;    /* Sidebar internal borders */
```

### Dark Theme

```css
/* Base Colors */
--background:         #0B0E14;    /* Deep dark - not pure black */
--background-subtle:  #0F1419;    /* Slightly lighter for layering */
--surface:            #151A23;    /* Cards, modals, elevated surfaces */
--surface-hover:      #1A2030;    /* Hover state for surfaces */
--surface-active:     #1F2738;    /* Active/pressed state */

/* Borders */
--border:             #1E2736;    /* Default borders - subtle but visible */
--border-subtle:      #171D28;    /* Very subtle dividers */
--border-strong:      #2A3544;    /* Emphasized borders */

/* Text Colors */
--text-primary:       #F1F5F9;    /* Headings, primary text */
--text-secondary:     #94A3B8;    /* Body text, descriptions */
--text-tertiary:      #64748B;    /* Placeholder, disabled, hints */
--text-inverse:       #0F172A;    /* Text on light/colored backgrounds */

/* Sidebar */
--sidebar-bg:         #0F1419;    /* Sidebar background */
--sidebar-text:       #E2E8F0;    /* Sidebar text */
--sidebar-text-muted: #64748B;    /* Sidebar secondary text */
--sidebar-hover:      #1A2030;    /* Sidebar item hover */
--sidebar-active:     #1E2736;    /* Sidebar active item */
--sidebar-border:     #1E2736;    /* Sidebar internal borders */
```

### Accent Colors (Same for Both Themes)

```css
/* Primary - Blue (main actions, links, focus states) */
--primary-50:         #EFF6FF;
--primary-100:        #DBEAFE;
--primary-200:        #BFDBFE;
--primary-300:        #93C5FD;
--primary-400:        #60A5FA;
--primary-500:        #3B82F6;    /* Main primary */
--primary-600:        #2563EB;    /* Hover */
--primary-700:        #1D4ED8;    /* Active */

/* Success - Green */
--success-50:         #ECFDF5;
--success-100:        #D1FAE5;
--success-500:        #10B981;    /* Main success */
--success-600:        #059669;    /* Hover */

/* Warning - Amber */
--warning-50:         #FFFBEB;
--warning-100:        #FEF3C7;
--warning-500:        #F59E0B;    /* Main warning */
--warning-600:        #D97706;    /* Hover */

/* Error - Red */
--error-50:           #FEF2F2;
--error-100:          #FEE2E2;
--error-500:          #EF4444;    /* Main error */
--error-600:          #DC2626;    /* Hover */

/* Game Colors (for game cards and accents) */
--game-skribble:      #EC4899;    /* Pink */
--game-trivia:        #3B82F6;    /* Blue */
--game-wordel:        #10B981;    /* Green */
--game-flagel:        #F59E0B;    /* Amber */
```

---

## Typography

### Font Family
```css
/* Primary font - clean, modern, highly legible */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace - for room codes, stats, timers */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
```

### Font Sizes (with consistent scale)
```css
--text-xs:    0.75rem;     /* 12px - labels, badges */
--text-sm:    0.875rem;    /* 14px - secondary text, buttons */
--text-base:  1rem;        /* 16px - body text */
--text-lg:    1.125rem;    /* 18px - emphasized body */
--text-xl:    1.25rem;     /* 20px - card titles */
--text-2xl:   1.5rem;      /* 24px - section headings */
--text-3xl:   1.875rem;    /* 30px - page titles */
--text-4xl:   2.25rem;     /* 36px - hero headings */
--text-5xl:   3rem;        /* 48px - large display */
```

### Font Weights
```css
--font-normal:    400;    /* Body text */
--font-medium:    500;    /* Emphasized text, nav items */
--font-semibold:  600;    /* Headings, buttons */
--font-bold:      700;    /* Strong emphasis */
```

### Line Heights
```css
--leading-none:   1;        /* Headings, display text */
--leading-tight:  1.25;     /* Compact headings */
--leading-snug:   1.375;    /* Subheadings */
--leading-normal: 1.5;      /* Body text */
--leading-relaxed: 1.625;   /* Long-form content */
```

### Letter Spacing
```css
--tracking-tighter: -0.05em;   /* Large headings */
--tracking-tight:   -0.025em;  /* Headings */
--tracking-normal:  0;         /* Body text */
--tracking-wide:    0.025em;   /* Buttons, labels */
--tracking-wider:   0.05em;    /* ALL CAPS labels */
--tracking-widest:  0.1em;     /* Room codes */
```

### Typography Usage

| Element | Size | Weight | Line Height | Tracking |
|---------|------|--------|-------------|----------|
| Display/Hero | 4xl-5xl | Bold | None | Tighter |
| Page Title | 3xl | Semibold | Tight | Tight |
| Section Heading | 2xl | Semibold | Tight | Normal |
| Card Title | xl | Semibold | Snug | Normal |
| Body Large | lg | Normal | Normal | Normal |
| Body | base | Normal | Normal | Normal |
| Body Small | sm | Normal | Normal | Normal |
| Label/Caption | xs | Medium | Normal | Wide |
| Button | sm | Medium | None | Wide |
| Room Code | xl | Bold (mono) | None | Widest |

---

## Spacing System

Use a consistent 4px base unit. All spacing should be multiples of 4px.

```css
--space-0:    0;
--space-0.5:  0.125rem;   /* 2px */
--space-1:    0.25rem;    /* 4px */
--space-1.5:  0.375rem;   /* 6px */
--space-2:    0.5rem;     /* 8px */
--space-2.5:  0.625rem;   /* 10px */
--space-3:    0.75rem;    /* 12px */
--space-3.5:  0.875rem;   /* 14px */
--space-4:    1rem;       /* 16px */
--space-5:    1.25rem;    /* 20px */
--space-6:    1.5rem;     /* 24px */
--space-7:    1.75rem;    /* 28px */
--space-8:    2rem;       /* 32px */
--space-9:    2.25rem;    /* 36px */
--space-10:   2.5rem;     /* 40px */
--space-12:   3rem;       /* 48px */
--space-14:   3.5rem;     /* 56px */
--space-16:   4rem;       /* 64px */
--space-20:   5rem;       /* 80px */
--space-24:   6rem;       /* 96px */
```

### Spacing Guidelines

| Context | Recommended Spacing |
|---------|---------------------|
| Inline elements gap | space-1 to space-2 (4-8px) |
| Form field gap | space-3 (12px) |
| Button internal padding | space-2.5 x space-4 (10px x 16px) |
| Card internal padding | space-5 to space-6 (20-24px) |
| Between cards | space-4 to space-6 (16-24px) |
| Section spacing | space-10 to space-16 (40-64px) |
| Page padding (mobile) | space-4 (16px) |
| Page padding (desktop) | space-6 to space-8 (24-32px) |
| Sidebar item padding | space-3 x space-4 (12px x 16px) |

---

## Border Radius

**Tasteful rounded corners - not too sharp, not too pill-shaped.**

```css
--radius-none:  0;
--radius-sm:    0.25rem;   /* 4px - small elements, badges */
--radius-md:    0.375rem;  /* 6px - inputs, small buttons */
--radius-lg:    0.5rem;    /* 8px - buttons, dropdowns */
--radius-xl:    0.75rem;   /* 12px - cards, modals */
--radius-2xl:   1rem;      /* 16px - large cards, panels */
--radius-3xl:   1.5rem;    /* 24px - hero sections, featured cards */
--radius-full:  9999px;    /* Pills, avatars, circular elements */
```

### Radius Usage

| Element | Radius |
|---------|--------|
| Badges, tags | sm (4px) |
| Input fields | md (6px) |
| Buttons (small) | md (6px) |
| Buttons (default) | lg (8px) |
| Dropdown menus | lg (8px) |
| Cards | xl (12px) |
| Modal dialogs | xl (12px) |
| Sidebar | 2xl (16px) on outer edge |
| Feature cards | 2xl (16px) |
| Game cards (landing) | 2xl-3xl (16-24px) |
| Avatars | full |
| Pills/chips | full |

---

## Shadows

**Subtle shadows - prefer borders over heavy shadows in dark mode.**

```css
/* Light Theme Shadows */
--shadow-sm:    0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
--shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05);

/* Dark Theme Shadows - more subtle, rely on borders more */
--shadow-sm:    0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.4);
--shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.5);
--shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.5);

/* Colored glow effects (for buttons, active states) */
--shadow-primary: 0 0 20px -5px rgb(59 130 246 / 0.5);
--shadow-success: 0 0 20px -5px rgb(16 185 129 / 0.5);
--shadow-error:   0 0 20px -5px rgb(239 68 68 / 0.5);
```

### Shadow Guidelines
- **Dark mode:** Use borders (`--border`) more than shadows
- **Light mode:** Subtle shadows for elevation
- **Hover states:** Slight shadow increase or glow effect
- **Modals/overlays:** `shadow-xl` with backdrop blur

---

## Components

### Buttons

```css
/* Base button styles */
.btn {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  padding: var(--space-2.5) var(--space-4);
  border-radius: var(--radius-lg);
  transition: all 150ms ease;
}

/* Primary */
.btn-primary {
  background: var(--primary-500);
  color: white;
}
.btn-primary:hover {
  background: var(--primary-600);
}

/* Secondary/Ghost */
.btn-secondary {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-secondary:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}

/* Sizes */
.btn-sm { padding: var(--space-1.5) var(--space-3); font-size: var(--text-xs); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
```

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.card-hover:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

/* Stat cards (like in dashboard reference) */
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}
.stat-card-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}
.stat-card-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-bottom: var(--space-1);
}
```

### Inputs

```css
.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-2.5) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: border-color 150ms ease;
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### Sidebar

```css
.sidebar {
  background: var(--sidebar-bg);
  width: 260px;
  border-right: 1px solid var(--sidebar-border);
  padding: var(--space-4);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2.5) var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--sidebar-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 150ms ease;
}

.sidebar-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text);
}

.sidebar-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text);
}

.sidebar-section-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--sidebar-text-muted);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-4);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.table td {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.table tr:hover td {
  background: var(--surface-hover);
}
```

### Badges / Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-0.5) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
}

.badge-success {
  background: rgb(16 185 129 / 0.1);
  color: var(--success-500);
}

.badge-warning {
  background: rgb(245 158 11 / 0.1);
  color: var(--warning-500);
}

.badge-error {
  background: rgb(239 68 68 / 0.1);
  color: var(--error-500);
}

.badge-primary {
  background: rgb(59 130 246 / 0.1);
  color: var(--primary-500);
}
```

---

## Layout Patterns

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (260px)   │  Main Content                       │
│                   │  ┌─────────────────────────────────┐│
│ • Logo            │  │ Header (search, actions)        ││
│ • Nav Items       │  ├─────────────────────────────────┤│
│ • Section Labels  │  │ Page Title + Actions            ││
│                   │  ├─────────────────────────────────┤│
│                   │  │ Stats Row                       ││
│                   │  │ ┌─────┐ ┌─────┐ ┌─────┐        ││
│                   │  │ │Card │ │Card │ │Card │        ││
│                   │  │ └─────┘ └─────┘ └─────┘        ││
│                   │  ├─────────────────────────────────┤│
│                   │  │ Charts / Tables                 ││
│ • Settings        │  │                                 ││
│ • Account         │  │                                 ││
└─────────────────────────────────────────────────────────┘
```

### Content Width
```css
--max-width-sm:   640px;   /* Form modals */
--max-width-md:   768px;   /* Medium content */
--max-width-lg:   1024px;  /* Standard content */
--max-width-xl:   1280px;  /* Wide content */
--max-width-2xl:  1536px;  /* Full dashboard */
```

### Grid System
```css
/* Use CSS Grid or Flexbox */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Standard gaps */
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

---

## Animation & Motion

**Use Motion (Framer Motion) for all complex animations and micro-interactions.**

```bash
pnpm add motion
```

### Animation Philosophy
- **Purposeful:** Every animation should serve a purpose (guide attention, provide feedback, create delight)
- **Tasteful:** Subtle and refined, never distracting or excessive
- **Performant:** Use `transform` and `opacity` for 60fps animations
- **Accessible:** Respect `prefers-reduced-motion`

### Durations
```typescript
// motion-config.ts
export const durations = {
  instant:  0.1,    // 100ms - micro feedback
  fast:     0.15,   // 150ms - button states
  normal:   0.2,    // 200ms - standard transitions
  moderate: 0.3,    // 300ms - page elements
  slow:     0.4,    // 400ms - modals, overlays
  slower:   0.5,    // 500ms - page transitions
  leisurely: 0.8,   // 800ms - complex sequences
}
```

### Easings (Spring & Cubic)
```typescript
export const easings = {
  // Cubic easings
  easeOut:    [0, 0, 0.2, 1],
  easeIn:     [0.4, 0, 1, 1],
  easeInOut:  [0.4, 0, 0.2, 1],
  
  // Spring configs (for natural, bouncy motion)
  spring: {
    default:  { type: 'spring', stiffness: 400, damping: 30 },
    gentle:   { type: 'spring', stiffness: 200, damping: 20 },
    bouncy:   { type: 'spring', stiffness: 400, damping: 15 },
    stiff:    { type: 'spring', stiffness: 500, damping: 35 },
    slow:     { type: 'spring', stiffness: 100, damping: 20 },
  }
}
```

### Motion Variants

#### Page Transitions
```typescript
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  },
}
```

#### Stagger Children (Lists, Grids)
```typescript
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  }
}
```

#### Card Hover
```typescript
export const cardHover = {
  rest: { 
    scale: 1, 
    y: 0,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] }
  },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}
```

#### Button Press
```typescript
export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 }
}
```

#### Modal / Dialog
```typescript
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
}
```

#### Sidebar Navigation
```typescript
export const sidebarItem = {
  rest: { x: 0, backgroundColor: 'transparent' },
  hover: { 
    x: 4, 
    backgroundColor: 'var(--sidebar-hover)',
    transition: { duration: 0.15 }
  }
}
```

---

## Micro-interactions with Motion

### 1. Button Feedback
```tsx
import { motion } from 'motion/react'

export function Button({ children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
```

### 2. Card Entrance (Grid)
```tsx
import { motion } from 'motion/react'

export function GameGrid({ games }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="grid grid-cols-4 gap-6"
    >
      {games.map((game, i) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: i * 0.08,
            duration: 0.4,
            ease: [0, 0, 0.2, 1]
          }}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
        >
          <GameCard game={game} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### 3. Score Counter Animation
```tsx
import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

export function AnimatedScore({ value }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))
  
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  
  return <motion.span>{display}</motion.span>
}
```

### 4. Toast / Notification
```tsx
export const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.2 }
  }
}
```

### 5. Loading Skeleton Shimmer
```tsx
export function Skeleton({ className }) {
  return (
    <motion.div
      className={`bg-surface rounded-lg ${className}`}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
```

### 6. Checkbox / Toggle
```tsx
export function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative w-12 h-6">
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ backgroundColor: checked ? 'var(--primary-500)' : 'var(--surface)' }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ x: checked ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}
```

---

## SVG Path Animations

### Animated Logo / Icons
```tsx
import { motion } from 'motion/react'

// Animated checkmark for success states
export function AnimatedCheck({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circle background */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--success-500)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      />
      {/* Checkmark */}
      <motion.path
        d="M7 12.5L10 15.5L17 8.5"
        stroke="var(--success-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3, ease: [0, 0, 0.2, 1] }}
      />
    </svg>
  )
}
```

### Animated X (Error/Close)
```tsx
export function AnimatedX({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--error-500)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M8 8L16 16M16 8L8 16"
        stroke="var(--error-500)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
    </svg>
  )
}
```

### Loading Spinner (SVG)
```tsx
export function Spinner({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0.2, rotate: 0 }}
        animate={{ 
          pathLength: [0.2, 0.8, 0.2],
          rotate: 360 
        }}
        transition={{
          pathLength: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
        }}
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}
```

### Animated Gamepad Icon (Logo)
```tsx
export function AnimatedGamepad({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Controller body */}
      <motion.path
        d="M8 20C8 16 12 12 18 12H30C36 12 40 16 40 20V28C40 34 36 38 30 38H18C12 38 8 34 8 28V20Z"
        stroke="var(--primary-500)"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
      />
      {/* D-pad */}
      <motion.path
        d="M16 22V26M14 24H18"
        stroke="var(--primary-500)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
      {/* Buttons */}
      <motion.circle
        cx="32"
        cy="22"
        r="2"
        fill="var(--primary-500)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
      />
      <motion.circle
        cx="36"
        cy="26"
        r="2"
        fill="var(--primary-500)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 400 }}
      />
    </svg>
  )
}
```

### Drawing Path Animation (for Skribble)
```tsx
export function DrawingPreview({ path }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <motion.path
        d={path}
        stroke="var(--primary-500)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
    </svg>
  )
}
```

### Confetti Burst (Win Animation)
```tsx
export function ConfettiBurst() {
  const particles = Array.from({ length: 20 })
  const colors = ['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360
        const distance = 100 + Math.random() * 100
        const x = Math.cos((angle * Math.PI) / 180) * distance
        const y = Math.sin((angle * Math.PI) / 180) * distance
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ 
              x, 
              y: y + 50, 
              scale: [0, 1, 1, 0],
              opacity: [1, 1, 1, 0],
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: 0.8 + Math.random() * 0.4,
              ease: [0, 0, 0.2, 1]
            }}
          />
        )
      })}
    </div>
  )
}
```

### Pulsing Dot (Live Indicator)
```tsx
export function LiveIndicator() {
  return (
    <span className="relative flex h-3 w-3">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-success-500"
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500" />
    </span>
  )
}
```

### Timer Countdown Ring
```tsx
export function TimerRing({ duration, timeLeft }) {
  const progress = timeLeft / duration
  const circumference = 2 * Math.PI * 45
  
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {/* Background ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="var(--surface)"
        strokeWidth="6"
        fill="none"
      />
      {/* Progress ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke={progress < 0.2 ? 'var(--error-500)' : 'var(--primary-500)'}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        transform="rotate(-90 50 50)"
        animate={{ 
          strokeDashoffset: circumference * (1 - progress),
          stroke: progress < 0.2 ? 'var(--error-500)' : 'var(--primary-500)'
        }}
        transition={{ duration: 0.3, ease: 'linear' }}
      />
      {/* Time text */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold fill-current"
      >
        {timeLeft}
      </text>
    </svg>
  )
}
```

---

## Presence Animations (AnimatePresence)

### List Item Enter/Exit
```tsx
import { motion, AnimatePresence } from 'motion/react'

export function PlayerList({ players }) {
  return (
    <AnimatePresence mode="popLayout">
      {players.map((player) => (
        <motion.div
          key={player.id}
          layout
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          exit={{ opacity: 0, x: 20, height: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <PlayerCard player={player} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

### Tab Content Transition
```tsx
export function TabContent({ activeTab, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## Layout Animations

### Shared Element Transition (Game Card → Game Screen)
```tsx
export function GameCard({ game }) {
  return (
    <motion.div layoutId={`game-${game.id}`}>
      <motion.img 
        layoutId={`game-icon-${game.id}`} 
        src={game.icon} 
      />
      <motion.h3 layoutId={`game-title-${game.id}`}>
        {game.name}
      </motion.h3>
    </motion.div>
  )
}

export function GameScreen({ game }) {
  return (
    <motion.div layoutId={`game-${game.id}`}>
      <motion.img 
        layoutId={`game-icon-${game.id}`} 
        src={game.icon} 
        className="w-16 h-16"
      />
      <motion.h1 layoutId={`game-title-${game.id}`}>
        {game.name}
      </motion.h1>
    </motion.div>
  )
}
```

### Reordering Animation (Leaderboard)
```tsx
export function Leaderboard({ players }) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  
  return (
    <div className="space-y-2">
      {sorted.map((player, rank) => (
        <motion.div
          key={player.id}
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex items-center gap-4 p-4 bg-surface rounded-xl"
        >
          <motion.span 
            layout
            className="text-2xl font-bold"
          >
            #{rank + 1}
          </motion.span>
          <span>{player.name}</span>
          <motion.span 
            layout
            className="ml-auto font-mono text-primary-500"
          >
            {player.score}
          </motion.span>
        </motion.div>
      ))}
    </div>
  )
}
```

---

## Reduced Motion Support

```tsx
// hooks/useReducedMotion.ts
import { useReducedMotion } from 'motion/react'

export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion()
  
  return {
    // Disable animations entirely for reduced motion
    transition: prefersReducedMotion 
      ? { duration: 0 } 
      : { type: 'spring', stiffness: 400, damping: 30 },
    
    // Simplified variants
    variants: prefersReducedMotion
      ? { initial: {}, animate: {}, exit: {} }
      : { 
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0 }
        }
  }
}
```

### Global Motion Config
```tsx
// app/providers.tsx
import { MotionConfig } from 'motion/react'

export function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

---

## Animation Guidelines Summary

| Element | Animation Type | Duration | Easing |
|---------|---------------|----------|--------|
| Button hover | Scale | instant | spring (stiff) |
| Button press | Scale down | instant | spring (stiff) |
| Card hover | Y translate + scale | fast | spring (default) |
| Modal enter | Scale + fade | normal | spring (default) |
| Modal exit | Fade | fast | ease-out |
| Page transition | Y slide + fade | moderate | ease-out |
| List stagger | Y slide + fade | moderate | ease-out + delay |
| Toast enter | Y slide + scale | normal | spring (bouncy) |
| Toast exit | X slide + fade | fast | ease-out |
| Score change | Number spring | slow | spring (gentle) |
| Loading spinner | Rotation + path | continuous | linear |
| Success check | Path draw | moderate | ease-out |
| Confetti | Burst outward | moderate | ease-out |

---

## Iconography

### Icon Library
Use **Lucide Icons** (already in project) - clean, consistent, good coverage.

### Icon Sizes
```css
--icon-xs:    14px;    /* Inline with small text */
--icon-sm:    16px;    /* Inline with body text */
--icon-md:    20px;    /* Buttons, inputs */
--icon-lg:    24px;    /* Navigation, headings */
--icon-xl:    32px;    /* Feature icons */
--icon-2xl:   48px;    /* Empty states, heroes */
```

### Icon Colors
- Match text color by default
- Use `currentColor` for flexibility
- Accent colors for status indicators

---

## Game-Specific Styles

### Game Cards (Landing Page)
```css
.game-card {
  background: linear-gradient(135deg, var(--game-color) 0%, var(--game-color-dark) 100%);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
}

.game-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgb(0 0 0 / 0.3));
}
```

### Room Code Display
```css
.room-code {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-widest);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
}
```

### Timer Display
```css
.timer {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.timer-warning {
  color: var(--error-500);
  animation: pulse 1s ease-in-out infinite;
}
```

---

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme
        background: {
          DEFAULT: '#F7F9FC',
          subtle: '#EEF1F6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F0F3F8',
          active: '#E8ECF3',
        },
        
        // Override for dark mode via CSS variables
        // Use CSS custom properties for dynamic theming
        
        // Game colors
        game: {
          skribble: '#EC4899',
          trivia: '#3B82F6',
          wordel: '#10B981',
          flagel: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        // ... etc
      },
    },
  },
}
```

---

## Responsive Breakpoints

```css
--breakpoint-sm:   640px;
--breakpoint-md:   768px;
--breakpoint-lg:   1024px;
--breakpoint-xl:   1280px;
--breakpoint-2xl:  1536px;
```

### Mobile-First Approach
- Design for mobile first
- Sidebar collapses to hamburger on mobile
- Cards stack vertically on small screens
- Touch targets minimum 44x44px

---

## Accessibility

### Focus States
```css
/* Visible focus ring for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Remove default outline, use custom */
:focus {
  outline: none;
}
```

### Color Contrast
- All text meets WCAG AA minimum (4.5:1 for normal text)
- Interactive elements meet 3:1 contrast ratio
- Don't rely solely on color to convey information

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Theme Implementation

### CSS Custom Properties Approach
```css
:root {
  /* Light theme (default) */
  --background: #F7F9FC;
  --surface: #FFFFFF;
  --text-primary: #0F172A;
  /* ... all other variables */
}

[data-theme="dark"] {
  --background: #0B0E14;
  --surface: #151A23;
  --text-primary: #F1F5F9;
  /* ... all other variables */
}
```

### Theme Toggle
- Store preference in localStorage
- Respect system preference (`prefers-color-scheme`) as default
- Smooth transition when switching themes
- Persist user choice across sessions

---

## Summary Checklist

When implementing any component, verify:

- [ ] Uses correct color variables (not hardcoded values)
- [ ] Uses consistent spacing from the scale
- [ ] Border radius matches guidelines (xl for cards, lg for buttons, etc.)
- [ ] Typography follows hierarchy
- [ ] Hover/focus states are implemented
- [ ] Works in both light and dark themes
- [ ] Responsive behavior is defined
- [ ] Transitions are smooth and consistent
- [ ] Accessible (keyboard nav, contrast, focus visible)
