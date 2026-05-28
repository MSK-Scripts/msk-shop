import { Wrench, RefreshCcw, MessageCircle, BookOpen, type LucideIcon } from 'lucide-react'

export interface HomeFeature {
  title: string
  description: string
  icon: LucideIcon
}

/**
 * Wird in components/home/WhyMSK.tsx als 4-Karten-Grid gerendert.
 * Reihenfolge = Reihenfolge in der UI.
 */
export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: Wrench,
    title: 'Quality over Quantity',
    description: 'Every script is personally coded, tested, and maintained — no template farms.',
  },
  {
    icon: RefreshCcw,
    title: 'Regular Updates',
    description: 'New features and bugfixes ship as they’re ready, not on a corporate roadmap.',
  },
  {
    icon: MessageCircle,
    title: 'Real Support',
    description: 'Discord support from the person who actually wrote the code.',
  },
  {
    icon: BookOpen,
    title: 'Open Documentation',
    description: 'Full guides, examples, and exports — no guessing how things work.',
  },
]
