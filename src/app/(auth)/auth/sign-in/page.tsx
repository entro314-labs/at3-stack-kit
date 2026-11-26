import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/sign-in-form'
import { sanitizeRedirectParam } from '@/lib/auth/redirect'

interface SignInPageProps {
  searchParams: Promise<{
    redirectTo?: string | string[]
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const redirectTo = sanitizeRedirectParam(params.redirectTo, '/dashboard')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-16 lg:flex-row lg:items-center">
      <section className="max-w-lg space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Authentication
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="text-muted-foreground">
          This route is the destination used by the auth middleware for protected pages.
        </p>
        <Link href="/" className="text-sm font-medium underline underline-offset-4">
          Back to home
        </Link>
      </section>

      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <SignInForm redirectTo={redirectTo} />
      </Suspense>
    </main>
  )
}
