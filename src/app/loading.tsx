export default function Loading() {
  return (
    <div className="min-h-screen bg-dao-charcoal flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dao-gold border-t-transparent" />
        <p className="text-dao-cool text-sm">Loading...</p>
      </div>
    </div>
  );
}
