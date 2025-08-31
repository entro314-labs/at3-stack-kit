'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

interface AuthButtonProps {
  user: User | null
  className?: string
}

export function AuthButton({ user, className }: AuthButtonProps) {
  const router = useRouter()

  if (user) {
    return <UserMenu user={user} {...(className && { className })} />
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="ghost" onClick={() => router.push('/auth/sign-in')}>
        Sign In
      </Button>
      <Button onClick={() => router.push('/auth/sign-up')}>Sign Up</Button>
    </div>
  )
}
