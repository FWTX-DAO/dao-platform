import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dao-charcoal flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-5xl text-dao-warm mb-4">404</h1>
      <p className="text-dao-cool text-lg mb-8">Page not found</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal text-sm font-semibold transition-all"
      >
        Go Home
      </Link>
    </main>
  );
}
