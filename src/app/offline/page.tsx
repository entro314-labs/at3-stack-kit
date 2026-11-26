export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">You are offline</h1>
      <p className="text-muted-foreground">
        Your network connection is unavailable right now. Reconnect and refresh to continue.
      </p>
    </main>
  )
}
