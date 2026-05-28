import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="container-page py-20 md:py-32">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-4 font-mono text-7xl font-bold tracking-tight text-[var(--color-primary)]">404</div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </Button>
      </div>
    </div>
  )
}
