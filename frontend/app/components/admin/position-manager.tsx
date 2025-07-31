'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface Position {
  id: number
  title: string
  description?: string
  maxVotes: number
  isActive: boolean
  candidates: Candidate[]
}

interface Candidate {
  id: number
  fullName: string
}

export function PositionManager() {
  const { data: session } = useSession()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxVotes: 1
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchPositions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPositions(data)
      } else {
        toast.error('Failed to fetch positions')
      }
    } catch (error) {
      toast.error('An error occurred while fetching positions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Position created successfully')
        setFormData({ title: '', description: '', maxVotes: 1 })
        setShowCreateForm(false)
        fetchPositions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create position')
      }
    } catch (error) {
      toast.error('An error occurred while creating position')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (positionId: number) => {
    if (!confirm('Are you sure you want to delete this position?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions/${positionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Position deleted successfully')
        fetchPositions()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete position')
      }
    } catch (error) {
      toast.error('An error occurred while deleting position')
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
        <h2 className="text-2xl font-bold text-gray-900">Positions</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          Create Position
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Create New Position</h3>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Votes
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxVotes}
                onChange={(e) => setFormData({ ...formData, maxVotes: parseInt(e.target.value) })}
                className="input"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Position'}
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
        {positions.map((position) => (
          <div key={position.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {position.title}
                </h3>
                {position.description && (
                  <p className="text-gray-600 mt-1">{position.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  <span>Max Votes: {position.maxVotes}</span>
                  <span className="ml-4">Candidates: {position.candidates.length}</span>
                  <span className={`ml-4 px-2 py-1 rounded-full text-xs ${
                    position.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {position.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(position.id)}
                className="btn btn-danger ml-4"
                disabled={position.candidates.length > 0}
                title={position.candidates.length > 0 ? 'Cannot delete position with candidates' : 'Delete position'}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No positions created yet.</p>
        </div>
      )}
    </div>
  )
}