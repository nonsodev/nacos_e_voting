'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { DocumentUpload } from '../../components/student/document-upload'
import { FaceCapture } from '../../components/student/face-capture'
import { LoadingSpinner } from '../../components/ui/loading-spinner'

type VerificationStep = 'matric' | 'document' | 'face' | 'complete'

export default function VerificationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<VerificationStep>('matric')
  const [matricNumber, setMatricNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleMatricSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matricNumber.trim()) {
      toast.error('Please enter your matric number')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/update-matric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ matricNumber }),
      })

      if (response.ok) {
        setCurrentStep('document')
        toast.success('Matric number saved successfully')
      } else {
        toast.error('Failed to save matric number')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUploaded = () => {
    setCurrentStep('face')
  }

  const handleFaceVerified = () => {
    setCurrentStep('complete')
    toast.success('Account verification complete!')
    setTimeout(() => {
      router.push('/student/dashboard')
    }, 2000)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'matric':
        return (
          <div className="card max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Enter Matric Number
            </h2>
            <form onSubmit={handleMatricSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matric Number
                </label>
                <input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="input"
                  placeholder="e.g., 240144011"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Continue'}
              </button>
            </form>
          </div>
        )

      case 'document':
        return (
          <DocumentUpload
            matricNumber={matricNumber}
            onSuccess={handleDocumentUploaded}
          />
        )

      case 'face':
        return (
          <FaceCapture
            matricNumber={matricNumber}
            onSuccess={handleFaceVerified}
          />
        )

      case 'complete':
        return (
          <div className="card max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Verification Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been successfully verified. You can now access the voting platform.
            </p>
            <LoadingSpinner className="mx-auto" />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Verification
          </h1>
          <p className="text-gray-600">
            Complete the verification process to activate your voting account
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: 'matric', label: 'Matric Number' },
              { key: 'document', label: 'Document Upload' },
              { key: 'face', label: 'Face Verification' },
              { key: 'complete', label: 'Complete' },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.key
                      ? 'bg-primary-600 text-white'
                      : index < ['matric', 'document', 'face', 'complete'].indexOf(currentStep)
                      ? 'bg-success-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index < ['matric', 'document', 'face', 'complete'].indexOf(currentStep) ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm text-gray-600">{step.label}</span>
                {index < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  )
}