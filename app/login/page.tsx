import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="bg-surface border border-borderlt rounded-xl p-8">
        <span className="msk-label">Account</span>
        <h1 className="text-2xl font-extrabold text-white mt-2 mb-3">Login</h1>
        <p className="text-muted text-sm mb-8">
          Login is handled automatically when you add a package to your cart
          and proceed to checkout via Tebex.
        </p>
        <Link href="/" className="msk-btn-primary">
          Browse Packages
        </Link>
      </div>
    </div>
  )
}
