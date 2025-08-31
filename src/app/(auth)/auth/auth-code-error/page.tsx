import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeError() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="font-bold text-2xl">Authentication Error</CardTitle>
          <CardDescription>Sorry, we couldn't complete your authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            There was an error processing your authentication request. This could happen if:
          </p>
          <ul className="space-y-1 text-left text-muted-foreground text-sm">
            <li>• The authentication link has expired</li>
            <li>• The link has already been used</li>
            <li>• There was a network issue</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/auth/sign-in">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
