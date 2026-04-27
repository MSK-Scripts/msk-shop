import Link from 'next/link'

export default function AccountPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="bg-surface border border-borderlt rounded-xl p-8">
        <span className="msk-label">Account</span>
        <h1 className="text-2xl font-extrabold text-white mt-2 mb-3">My Account</h1>
        <p className="text-muted text-sm mb-8">
          To view your purchases and downloads, please visit the Tebex account portal.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="https://checkout.tebex.io/payment-history"
            target="_blank"
            rel="noopener noreferrer"
            className="msk-btn-primary w-full justify-center"
          >
            View Purchase History →
          </a>
          <Link href="/" className="msk-btn-ghost w-full justify-center">
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
