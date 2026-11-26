import Link from 'next/link'
import { AIPlayground } from '@/components/ai/ai-playground'
import { AuthButton } from '@/components/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getOptionalUser } from '@/lib/auth/server-user'

export default async function HomePage() {
  const user = await getOptionalUser()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <Badge variant="outline" className="w-fit">
            Reference App
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Auth routes, protected pages, and AI endpoints are now reachable from the app shell.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              This page is the integration surface for the Supabase auth components and the
              `/api/chat` route already in the repo. Use it to verify the runtime flow instead of
              only the underlying helpers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
          <AuthButton user={user} />
        </div>

        <div className="grid gap-4 rounded-3xl border bg-slate-50/60 p-6 text-sm text-slate-700 shadow-sm">
          <div className="space-y-1">
            <p className="font-medium text-slate-900">Auth flow</p>
            <p>`/auth/sign-in`, `/auth/sign-up`, and `/auth/reset-password` now render real forms.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-slate-900">Protected routes</p>
            <p>`/dashboard`, `/profile`, and `/settings` now exist and match middleware redirects.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-slate-900">AI runtime</p>
            <p>The chat panel below calls the existing streaming API route instead of a stub UI.</p>
          </div>
        </div>
      </section>

      <AIPlayground />
    </main>
  )
}

