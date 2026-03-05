'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-dao-charcoal flex flex-col items-center justify-center px-6" role="alert">
      <h1 className="font-display text-4xl text-dao-warm mb-4">Something went wrong</h1>
      <p className="text-dao-cool text-base mb-8">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      >
        Try Again
      </button>
    </main>
  );
}
