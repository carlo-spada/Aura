export default function ProcessingPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold">We’re getting your first results</h2>
      <p className="mt-3 text-neutral-400">AURA is discovering and ranking jobs based on your preferences. You’ll be notified when your batch is ready.</p>
      <div className="mx-auto mt-8 h-2 w-64 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full w-1/2 animate-pulse bg-neutral-600" />
      </div>
    </div>
  )
}

