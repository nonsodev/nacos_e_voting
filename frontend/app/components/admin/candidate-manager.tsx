"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button"; 
import { Input } from "../ui/input"; 
import { Modal } from "../ui/modal"; 


interface Candidate {
  id: number;
  fullName: string;
  matricNumber?: string;
  nickName?: string;
  imageUrl?: string;
  isActive: boolean;
  positionTitle: string;
}
interface Position {
  id: number;
  title: string;
}

export function CandidateManager() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    nickName: "",
    positionId: 0,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]); 

  const fetchData = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const [candidatesResponse, positionsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);
      if (candidatesResponse.ok) setCandidates(await candidatesResponse.json());
      if (positionsResponse.ok) setPositions(await positionsResponse.json());
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.positionId === 0) {
      toast.error("Please select a position.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("matricNumber", formData.matricNumber);
      formDataToSend.append("nickName", formData.nickName);
      formDataToSend.append("positionId", formData.positionId.toString());
      if (selectedImage) formDataToSend.append("Image", selectedImage); 

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/candidates`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        toast.success("Candidate created successfully");
        setFormData({
          fullName: "",
          matricNumber: "",
          nickName: "",
          positionId: 0,
        });
        setSelectedImage(null);
        setShowCreateForm(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create candidate");
      }
    } catch (error) {
      toast.error("An error occurred while creating candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (candidateId: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/candidates/${candidateId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        toast.success("Candidate deleted successfully");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete candidate");
      }
    } catch (error) {
      toast.error("An error occurred while deleting candidate");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800">
          Candidate Management
        </h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={positions.length === 0}
        >
          Add Candidate
        </Button>
      </div>

      {positions.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600">
            You must create positions first before adding candidates.
          </p>
        </div>
      )}

      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Add New Candidate"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Matric Number
            </label>
            <Input
              type="text"
              value={formData.matricNumber}
              onChange={(e) =>
                setFormData({ ...formData, matricNumber: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Position *
            </label>
            <select
              value={formData.positionId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  positionId: parseInt(e.target.value),
                })
              }
              className="w-full h-10 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
              required
            >
              <option value={0} disabled>
                Select a position...
              </option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nickname
            </label>
            <Input
              type="text"
              value={formData.nickName}
              onChange={(e) =>
                setFormData({ ...formData, nickName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Photo
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" /> Creating...
                </>
              ) : (
                "Add Candidate"
              )}
            </Button>
          </div>
        </form>
      </Modal>


      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Candidate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Position
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
              Nickname
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={candidate.imageUrl || "/default-avatar.png"}
                        alt={candidate.fullName}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-900">
                        {candidate.fullName}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {candidate.matricNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {candidate.positionTitle || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {candidate.nickName || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      candidate.isActive
                        ? "bg-success/20 text-success"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {candidate.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    onClick={() => handleDelete(candidate.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {candidates.length === 0 && positions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-neutral-500">No candidates have been added yet.</p>
        </div>
      )}
    </div>
  );
}
