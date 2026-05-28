import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  return (
    <div className="container-page py-20 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-8">
          <span className="eyebrow mx-auto inline-flex">Account</span>
          <h1 className="mb-3 mt-3 text-2xl font-bold tracking-tight">Login</h1>
          <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">
            Login is handled automatically when you add a package to your cart
            and proceed to checkout via Tebex.
          </p>
          <Button asChild>
            <Link href="/packages">Browse Packages</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
