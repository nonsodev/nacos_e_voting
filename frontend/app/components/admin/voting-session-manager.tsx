'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface VotingSession {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  createdBy: {
    fullName: string
  }
}

export function VotingSessionManager() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<VotingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      } else {
        toast.error('Failed to fetch voting sessions')
      }
    } catch (error) {
      toast.error('An error occurred while fetching sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString()
        }),
      })

      if (response.ok) {
        toast.success('Voting session created successfully')
        setFormData({ title: '', description: '', startTime: '', endTime: '' })
        setShowCreateForm(false)
        fetchSessions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create voting session')
      }
    } catch (error) {
      toast.error('An error occurred while creating session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartVoting = async (sessionId: number) => {
    if (!confirm('Are you sure you want to start this voting session? This will deactivate all other sessions.')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Voting session started successfully')
        fetchSessions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to start voting session')
      }
    } catch (error) {
      toast.error('An error occurred while starting session')
    }
  }

  const handleEndVoting = async (sessionId: number) => {
    if (!confirm('Are you sure you want to end this voting session?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Voting session ended successfully')
        fetchSessions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to end voting session')
      }
    } catch (error) {
      toast.error('An error occurred while ending session')
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Voting Sessions</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create Session
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Create New Voting Session</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.map((session) => (
          <div key={session.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-gray-600 mt-1">{session.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  <p>Start: {new Date(session.startTime).toLocaleString()}</p>
                  <p>End: {new Date(session.endTime).toLocaleString()}</p>
                  <p>Created by: {session.createdBy.fullName}</p>
                  <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  session.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2 ml-4">
                {!session.isActive ? (
                  <button
                    onClick={() => handleStartVoting(session.id)}
                    className="btn btn-success"
                    disabled={new Date(session.endTime) < new Date()}
                  >
                    Start Voting
                  </button>
                ) : (
                  <button
                    onClick={() => handleEndVoting(session.id)}
                    className="btn btn-danger"
                  >
                    End Voting
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No voting sessions created yet.</p>
        </div>
      )}
    </div>
  )
}