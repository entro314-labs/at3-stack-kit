'use client'

import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Suspense } from 'react'
import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { PasswordUpdateForm } from '@/components/auth/password-update-form'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  const shouldTryRecovery = useMemo(() => {
    if (code) {
      return true
    }

    if (type === 'recovery') {
      return true
    }

    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      return hashParams.get('type') === 'recovery'
    }

    return false
  }, [code, type])

  const [isCheckingRecovery, setIsCheckingRecovery] = useState(shouldTryRecovery)
  const [isRecoverySessionReady, setIsRecoverySessionReady] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldTryRecovery) {
      setIsCheckingRecovery(false)
      setIsRecoverySessionReady(false)
      setRecoveryError(null)
      return
    }

    let isActive = true
    const supabase = createBrowserClient()

    const resolveRecoverySession = async () => {
      setIsCheckingRecovery(true)
      setRecoveryError(null)

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            throw error
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error('Password recovery session is not available.')
        }

        if (!isActive) {
          return
        }

        setIsRecoverySessionReady(true)

        if (code || type) {
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          url.searchParams.delete('type')
          url.searchParams.delete('next')
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
        }
      } catch {
        if (!isActive) {
          return
        }

        setIsRecoverySessionReady(false)
        setRecoveryError('The password reset link is invalid or expired. Request a new link below.')
      } finally {
        if (isActive) {
          setIsCheckingRecovery(false)
        }
      }
    }

    void resolveRecoverySession()

    return () => {
      isActive = false
    }
  }, [code, shouldTryRecovery, type])

  if (isCheckingRecovery) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (isRecoverySessionReady) {
    return <PasswordUpdateForm />
  }

  return (
    <div className="space-y-4">
      {recoveryError ? (
        <div className="border-destructive/20 bg-destructive/15 rounded-md border px-4 py-3 text-sm">
          {recoveryError}
        </div>
      ) : null}
      <PasswordResetForm onBack={() => window.history.back()} />
    </div>
  )
}
