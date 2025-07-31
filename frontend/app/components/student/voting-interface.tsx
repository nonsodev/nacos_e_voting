'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

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
  biography?: string
  imageUrl?: string
}

interface VotingInterfaceProps {
  positions: Position[]
  onVoteCast: () => void
}

export function VotingInterface({ positions, onVoteCast }: VotingInterfaceProps) {
  const { data: session } = useSession()
  const [selectedCandidates, setSelectedCandidates] = useState<Record<number, number>>({})
  const [votingInProgress, setVotingInProgress] = useState<Record<number, boolean>>({})

  const handleCandidateSelect = (positionId: number, candidateId: number) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [positionId]: candidateId
    }))
  }

  const handleVote = async (positionId: number) => {
    const candidateId = selectedCandidates[positionId]
    if (!candidateId) {
      toast.error('Please select a candidate first')
      return
    }

    setVotingInProgress(prev => ({ ...prev, [positionId]: true }))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voting/cast-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          positionId,
          candidateId
        }),
      })

      if (response.ok) {
        toast.success('Vote cast successfully!')
        onVoteCast()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to cast vote')
      }
    } catch (error) {
      toast.error('An error occurred while casting vote')
    } finally {
      setVotingInProgress(prev => ({ ...prev, [positionId]: false }))
    }
  }

  if (positions.length === 0) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-semibold mb-2">No Positions Available</h2>
        <p className="text-gray-600">
          There are no positions available for voting at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Cast Your Vote</h2>
        <p className="text-gray-600">
          Select your preferred candidate for each position
        </p>
      </div>

      {positions.map((position) => (
        <div key={position.id} className="card">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {position.title}
            </h3>
            {position.description && (
              <p className="text-gray-600 mb-4">{position.description}</p>
            )}
            
            {position.hasVoted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    You have already voted for this position
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {position.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedCandidates[position.id] === candidate.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCandidateSelect(position.id, candidate.id)}
                    >
                      <div className="flex items-center mb-3">
                        <input
                          type="radio"
                          name={`position-${position.id}`}
                          checked={selectedCandidates[position.id] === candidate.id}
                          onChange={() => handleCandidateSelect(position.id, candidate.id)}
                          className="mr-3"
                        />
                        {candidate.imageUrl && (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.fullName}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {candidate.fullName}
                          </h4>
                          {candidate.matricNumber && (
                            <p className="text-sm text-gray-600">
                              {candidate.matricNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      {candidate.biography && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {candidate.biography}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleVote(position.id)}
                    disabled={!selectedCandidates[position.id] || votingInProgress[position.id]}
                    className="btn btn-primary px-8"
                  >
                    {votingInProgress[position.id] ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Casting Vote...</span>
                      </>
                    ) : (
                      'Cast Vote'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}