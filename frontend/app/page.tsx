'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginForm } from './components/auth/login-form'
import { LoadingSpinner } from './components/ui/loading-spinner'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      // Redirect based on user role
      if (session.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (session.user.isActivated) {
        router.push('/student/dashboard')
      } else {
        router.push('/student/verification')
      }
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LASU E-Voting
          </h1>
          <p className="text-gray-600">
            Secure student voting platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}