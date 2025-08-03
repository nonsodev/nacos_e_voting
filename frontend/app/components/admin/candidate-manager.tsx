'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/loading-spinner'

interface Candidate {
  id: number
  fullName: string
  matricNumber?: string
  nickName?: string
  imageUrl?: string
  isActive: boolean
  positionTitle: string
}

interface Position {
  id: number
  title: string
}

export function CandidateManager() {
  const { data: session } = useSession()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    matricNumber: '',
    nickName: '',
    positionId: 0
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [candidatesResponse, positionsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` },
        })
      ])

      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json()
        setCandidates(candidatesData)
      }

      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json()
        setPositions(positionsData)
      }
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('matricNumber', formData.matricNumber)
      formDataToSend.append('nickName', formData.nickName)
      formDataToSend.append('positionId', formData.positionId.toString())
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formDataToSend,
      })

      if (response.ok) {
        toast.success('Candidate created successfully')
        setFormData({ fullName: '', matricNumber: '', nickName: '', positionId: 0 })
        setSelectedImage(null)
        setShowCreateForm(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create candidate')
      }
    } catch (error) {
      toast.error('An error occurred while creating candidate')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (candidateId: number) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Candidate deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete candidate')
      }
    } catch (error) {
      toast.error('An error occurred while deleting candidate')
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
        <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          disabled={positions.length === 0}
        >
          Add Candidate
        </button>
      </div>

      {positions.length === 0 && (
        <div className="card text-center">
          <p className="text-gray-600">
            You need to create positions first before adding candidates.
          </p>
        </div>
      )}

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Candidate</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matric Number
              </label>
              <input
                type="text"
                value={formData.matricNumber}
                onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <select
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: parseInt(e.target.value) })}
                className="input"
                required
              >
                <option value={0}>Select a position</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickName}
                onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="input"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Candidate'}
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
        {candidates.map((candidate) => (
          <div key={candidate.id} className="card">
            <div className="flex items-start space-x-4">
              {candidate.imageUrl && (
                <img
                  src={candidate.imageUrl}
                  alt={candidate.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {candidate.fullName}
                </h3>
                <p className="text-sm text-gray-600">
                Position: {candidate.positionTitle || "Unknown"}
                </p>
                {candidate.matricNumber && (
                  <p className="text-sm text-gray-600">
                    Matric: {candidate.matricNumber}
                  </p>
                )}
                {candidate.nickName && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {candidate.nickName}
                  </p>
                )}
                <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                  candidate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {candidate.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(candidate.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && positions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No candidates added yet.</p>
        </div>
      )}
    </div>
  )
}