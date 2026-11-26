import Link from 'next/link'
import { AuthButton } from '@/components/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOptionalUser } from '@/lib/auth/server-user'

export default async function SettingsPage() {
  const user = await getOptionalUser()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Settings
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Account settings</h1>
          <p className="text-muted-foreground">
            This route closes the gap between the user menu and the actual route tree.
          </p>
        </div>
        <AuthButton user={user} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Session status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            {user
              ? 'You are signed in and the protected route middleware is active.'
              : 'No active session was detected for this request.'}
          </p>
          <Link href="/dashboard" className="inline-block font-medium underline underline-offset-4">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

