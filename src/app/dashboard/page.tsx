import Link from 'next/link'
import { AuthButton } from '@/components/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOptionalUser } from '@/lib/auth/server-user'

export default async function DashboardPage() {
  const user = await getOptionalUser()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Protected workspace</h1>
          <p className="text-muted-foreground max-w-2xl">
            This route exists so the auth middleware has a real signed-in destination.
          </p>
        </div>
        <AuthButton user={user} />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/profile" className="text-sm font-medium underline underline-offset-4">
              View profile details
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/settings" className="text-sm font-medium underline underline-offset-4">
              Open account settings
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-sm font-medium underline underline-offset-4">
              Return to the AI playground
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

