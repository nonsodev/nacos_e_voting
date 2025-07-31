'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface DocumentUploadProps {
  matricNumber: string
  onSuccess: () => void
}

export function DocumentUpload({ matricNumber, onSuccess }: DocumentUploadProps) {
  const { data: session } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
  }

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('document', uploadedFile)
      formData.append('matricNumber', matricNumber)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        if (result.verified) {
          toast.success('Document verified successfully!')
          onSuccess()
        } else {
          toast.error('Document verification failed. Please check your details and try again.')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Upload Course Form
      </h2>
      
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">Requirements:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Must contain your full name and matric number</li>
            <li>• Document must be clear and readable</li>
          </ul>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
            >
              Choose Different File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload your Course Form
              </p>
              <p className="text-gray-600 mb-4">
                Click to browse or drag and drop your PDF file here
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
              >
                Choose File
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadedFile && (
        <div className="flex justify-center">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn btn-primary px-8"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Verifying Document...</span>
              </>
            ) : (
              'Upload & Verify'
            )}
          </button>
        </div>
      )}
    </div>
  )
}