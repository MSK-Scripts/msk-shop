import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AccountPage() {
  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-8">
          <span className="eyebrow mx-auto inline-flex">Account</span>
          <h1 className="mb-3 mt-3 text-2xl font-bold tracking-tight">My Account</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            To view your purchases and downloads, please visit the Tebex account portal.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <a
                href="https://checkout.tebex.io/payment-history"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Purchase History
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
