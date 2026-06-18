import { Wrench, RefreshCcw, MessageCircle, BookOpen, type LucideIcon } from 'lucide-react'

/**
 * Icons für die "Why MSK"-Karten (components/home/WhyMSK.tsx).
 * Reihenfolge = Reihenfolge der Texte in `homeTranslations.*.why_features`
 * (lib/i18n.ts) — Index-basiert gezippt. Texte sind dort übersetzbar.
 */
export const HOME_FEATURE_ICONS: LucideIcon[] = [
  Wrench,         // Quality over Quantity
  RefreshCcw,     // Regular Updates
  MessageCircle,  // Real Support
  BookOpen,       // Open Documentation
]
