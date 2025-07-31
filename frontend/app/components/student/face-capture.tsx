'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface FaceCaptureProps {
  matricNumber: string
  onSuccess: () => void
}

export function FaceCapture({ matricNumber, onSuccess }: FaceCaptureProps) {
  const { data: session } = useSession()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCapturing(true)
    } catch (error) {
      toast.error('Failed to access camera. Please allow camera permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      stopCamera()
    }
  }, [stopCamera])

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const verifyFace = async () => {
    if (!capturedImage) {
      toast.error('Please capture a photo first')
      return
    }

    setIsVerifying(true)
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('faceImage', blob, 'face.jpg')
      formData.append('matricNumber', matricNumber)

      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/verify-face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formData,
      })

      if (verifyResponse.ok) {
        const result = await verifyResponse.json()
        if (result.verified) {
          toast.success('Face verification successful!')
          onSuccess()
        } else {
          toast.error('Face verification failed. Please try again.')
        }
      } else {
        const error = await verifyResponse.json()
        toast.error(error.message || 'Verification failed')
      }
    } catch (error) {
      toast.error('An error occurred during verification')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Face Verification
      </h2>
      
      <div className="mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-yellow-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Look directly at the camera</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Remove glasses or face coverings if possible</li>
            <li>• Keep your face centered in the frame</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {!isCapturing && !capturedImage && (
          <div className="text-center">
            <div className="w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <button
              onClick={startCamera}
              className="btn btn-primary"
            >
              Start Camera
            </button>
          </div>
        )}

        {isCapturing && (
          <div className="text-center">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-64 h-48 bg-black rounded-lg"
              />
              <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary-500"></div>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={stopCamera}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="btn btn-primary"
              >
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="text-center">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-64 h-48 object-cover rounded-lg"
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={retakePhoto}
                className="btn btn-secondary"
              >
                Retake Photo
              </button>
              <button
                onClick={verifyFace}
                disabled={isVerifying}
                className="btn btn-primary"
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Verifying...</span>
                  </>
                ) : (
                  'Verify Face'
                )}
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}