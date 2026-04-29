/* ──────────────────────────────────────────────────────────────────
   Shared icon vocabulary for Arcado.

   The app has two existing icon styles:
     • lucide-react (used in /admin)
     • inline stroke-based SVGs (used in /lobby, /room, /auth, …)

   Both are stroke-based 24×24 with similar weight, so they read as
   one system visually. To keep code consistent and avoid the dozens
   of duplicate `function IconCheck()` definitions scattered across
   feature files, prefer importing icons from this module instead of
   redefining inline SVGs in new code.

   Re-exports lucide-react icons under shorter, consistent names with
   the project's default size (16) and strokeWidth (2) baked in.
   ────────────────────────────────────────────────────────────── */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Home,
  LogIn,
  LogOut,
  Menu,
  Minus,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  User,
  Users,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

/* Default props shared by all icon re-exports. Caller can override. */
const defaultProps: Pick<LucideProps, 'size' | 'strokeWidth' | 'absoluteStrokeWidth'> = {
  size: 16,
  strokeWidth: 2,
}

function wrap(Icon: LucideIcon) {
  return function IconComponent(props: LucideProps) {
    return <Icon {...defaultProps} {...props} />
  }
}

export const IconArrowLeft = wrap(ArrowLeft)
export const IconArrowRight = wrap(ArrowRight)
export const IconCheck = wrap(Check)
export const IconChevronDown = wrap(ChevronDown)
export const IconChevronLeft = wrap(ChevronLeft)
export const IconChevronRight = wrap(ChevronRight)
export const IconChevronUp = wrap(ChevronUp)
export const IconCopy = wrap(Copy)
export const IconExternal = wrap(ExternalLink)
export const IconHome = wrap(Home)
export const IconLogIn = wrap(LogIn)
export const IconLogOut = wrap(LogOut)
export const IconMenu = wrap(Menu)
export const IconMinus = wrap(Minus)
export const IconPlus = wrap(Plus)
export const IconSearch = wrap(Search)
export const IconSettings = wrap(Settings)
export const IconShare = wrap(Share2)
export const IconTrash = wrap(Trash2)
export const IconUser = wrap(User)
export const IconUsers = wrap(Users)
export const IconX = wrap(X)
