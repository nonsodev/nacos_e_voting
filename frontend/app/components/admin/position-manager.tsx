"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button"; 
import { Input } from "../ui/input"; 
import { Textarea } from "../ui/textarea";
import { Modal } from "../ui/modal"; 

interface Position {
  id: number;
  title: string;
  description?: string;
  maxVotes: number;
  isActive: boolean;
  candidates: Candidate[];
}
interface Candidate {
  id: number;
  fullName: string;
}

export function PositionManager() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxVotes: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) fetchPositions();
  }, [session]);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/positions`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        setPositions(await response.json());
      } else {
        toast.error("Failed to fetch positions");
      }
    } catch (error) {
      toast.error("An error occurred while fetching positions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/positions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );
      if (response.ok) {
        toast.success("Position created successfully");
        setFormData({ title: "", description: "", maxVotes: 1 });
        setShowCreateForm(false);
        fetchPositions();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create position");
      }
    } catch (error) {
      toast.error("An error occurred while creating position");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (positionId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this position? This cannot be undone."
      )
    )
      return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/positions/${positionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        toast.success("Position deleted successfully");
        fetchPositions();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete position");
      }
    } catch (error) {
      toast.error("An error occurred while deleting position");
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
          Position Management
        </h1>
        <Button onClick={() => setShowCreateForm(true)}>Create Position</Button>
      </div>


      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Position"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Max Votes *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.maxVotes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxVotes: parseInt(e.target.value) || 1,
                })
              }
              required
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
                "Create Position"
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
                Position
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Stats
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {positions.map((position) => (
              <tr key={position.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-neutral-900">
                    {position.title}
                  </div>
                  <div className="text-sm text-neutral-500 line-clamp-2">
                    {position.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-700">
                    Max Votes: {position.maxVotes}
                  </div>
                  <div className="text-sm text-neutral-700">
                    Candidates: {position.candidates.length}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    onClick={() => handleDelete(position.id)}
                    variant="danger"
                    size="sm"
                    disabled={position.candidates.length > 0}
                    title={
                      position.candidates.length > 0
                        ? "Cannot delete a position that has candidates"
                        : "Delete position"
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {positions.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg">
          <h3 className="font-semibold text-neutral-800">No Positions Found</h3>
          <p className="text-neutral-500 mt-1">
            Get started by creating a new voting position.
          </p>
        </div>
      )}
    </div>
  );
}
