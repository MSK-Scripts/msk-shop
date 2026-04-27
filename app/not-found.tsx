import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="text-7xl font-extrabold text-accent mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-muted text-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="msk-btn-primary">← Back to Shop</Link>
    </div>
  )
}
