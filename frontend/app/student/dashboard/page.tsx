'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../../components/ui/loading-spinner'
import { VotingInterface } from '../../components/student/voting-interface'

interface Position {
  id: number
  title: string
  description?: string
  maxVotes: number
  hasVoted: boolean
  candidates: Candidate[]
}

interface Candidate {
  id: number
  fullName: string
  matricNumber?: string
  nickName?: string
  imageUrl?: string
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [votingActive, setVotingActive] = useState(false)

  useEffect(() => {
    if (session?.user && !session.user.isActivated) {
      router.push('/student/verification')
      return
    }

    fetchVotingData()
  }, [session, router])

  const fetchVotingData = async () => {
    try {
      setIsLoading(true)
      
      // Check voting status
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voting/voting-status`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setVotingActive(statusData.isActive)
        
        if (statusData.isActive) {
          // Fetch positions and candidates
          const positionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voting/positions`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
          
          if (positionsResponse.ok) {
            const positionsData = await positionsResponse.json()
            setPositions(positionsData)
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load voting data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteCast = () => {
    // Refresh data after vote is cast
    fetchVotingData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {session?.user?.name}
              </h1>
              <p className="text-gray-600">
                Matric: {session?.user?.matricNumber}
              </p>
            </div>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="btn btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!votingActive ? (
          <div className="card text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Voting Not Active</h2>
            <p className="text-gray-600">
              There is no active voting session at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <VotingInterface 
            positions={positions} 
            onVoteCast={handleVoteCast}
          />
        )}
      </div>
    </div>
  )
}