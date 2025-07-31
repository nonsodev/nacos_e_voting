'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface Position {
  id: number
  title: string
  candidates: Candidate[]
}

interface Candidate {
  id: number
  fullName: string
  matricNumber?: string
  imageUrl?: string
}

interface VoteResults {
  [positionId: number]: {
    [candidateId: number]: number
  }
}

export function ResultsViewer() {
  const { data: session } = useSession()
  const [positions, setPositions] = useState<Position[]>([])
  const [results, setResults] = useState<VoteResults>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const [positionsResponse, resultsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/results`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` },
        })
      ])

      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json()
        setPositions(positionsData)
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setResults(resultsData)
      }
    } catch (error) {
      toast.error('Failed to fetch results')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalVotes = (positionId: number): number => {
    const positionResults = results[positionId] || {}
    return Object.values(positionResults).reduce((sum, votes) => sum + votes, 0)
  }

  const getCandidateVotes = (candidateId: number, positionId: number): number => {
    return results[positionId]?.[candidateId] || 0
  }

  const getVotePercentage = (candidateId: number, positionId: number): number => {
    const candidateVotes = getCandidateVotes(candidateId, positionId)
    const totalVotes = getTotalVotes(positionId)
    return totalVotes > 0 ? (candidateVotes / totalVotes) * 100 : 0
  }

  const getWinner = (positionId: number): Candidate | null => {
    const position = positions.find(p => p.id === positionId)
    if (!position) return null

    let winner = null
    let maxVotes = 0

    position.candidates.forEach(candidate => {
      const votes = getCandidateVotes(candidate.id, positionId)
      if (votes > maxVotes) {
        maxVotes = votes
        winner = candidate
      }
    })

    return winner
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vote Results</h2>
        <button
          onClick={fetchResults}
          className="btn btn-secondary"
        >
          Refresh Results
        </button>
      </div>

      {positions.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600">No positions available.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {positions.map((position) => {
            const totalVotes = getTotalVotes(position.id)
            const winner = getWinner(position.id)

            return (
              <div key={position.id} className="card">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {position.title}
                  </h3>
                  <p className="text-gray-600">
                    Total Votes: {totalVotes}
                  </p>
                  {winner && totalVotes > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        🏆 Winner: {winner.fullName} ({getCandidateVotes(winner.id, position.id)} votes)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {position.candidates.map((candidate) => {
                    const votes = getCandidateVotes(candidate.id, position.id)
                    const percentage = getVotePercentage(candidate.id, position.id)
                    const isWinner = winner?.id === candidate.id && totalVotes > 0

                    return (
                      <div
                        key={candidate.id}
                        className={`border rounded-lg p-4 ${
                          isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {candidate.imageUrl && (
                              <img
                                src={candidate.imageUrl}
                                alt={candidate.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {candidate.fullName}
                                {isWinner && <span className="ml-2 text-green-600">👑</span>}
                              </h4>
                              {candidate.matricNumber && (
                                <p className="text-sm text-gray-600">
                                  {candidate.matricNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">{votes}</p>
                            <p className="text-sm text-gray-600">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        {/* Vote Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isWinner ? 'bg-green-500' : 'bg-primary-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {position.candidates.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No candidates for this position.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}