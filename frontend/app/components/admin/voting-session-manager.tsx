"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Modal } from "../ui/modal";

interface VotingSession {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { fullName: string };
}

export function VotingSessionManager() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) fetchSessions();
  }, [session]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        setSessions(await response.json());
      } else {
        toast.error("Failed to fetch voting sessions");
      }
    } catch (error) {
      toast.error("An error occurred while fetching sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            ...formData,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
          }),
        }
      );
      if (response.ok) {
        toast.success("Voting session created successfully");
        setFormData({ title: "", description: "", startTime: "", endTime: "" });
        setShowCreateForm(false);
        fetchSessions();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create voting session");
      }
    } catch (error) {
      toast.error("An error occurred while creating session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartVoting = async (sessionId: number) => {
    if (
      !confirm(
        "Are you sure you want to start this voting session? This will deactivate all other sessions."
      )
    )
      return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions/${sessionId}/start`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        toast.success("Voting session started successfully");
        fetchSessions();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start voting session");
      }
    } catch (error) {
      toast.error("An error occurred while starting session");
    }
  };

  const handleEndVoting = async (sessionId: number) => {
    if (!confirm("Are you sure you want to end this voting session?")) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/voting-sessions/${sessionId}/end`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (response.ok) {
        toast.success("Voting session ended successfully");
        fetchSessions();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to end voting session");
      }
    } catch (error) {
      toast.error("An error occurred while ending session");
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
          Session Management
        </h1>
        <Button onClick={() => setShowCreateForm(true)}>Create Session</Button>
      </div>

      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Voting Session"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Start Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                End Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>
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
                "Create Session"
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
                Session
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Timeline
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
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-neutral-900">
                    {session.title}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {session.createdBy.fullName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  <p>Start: {new Date(session.startTime).toLocaleString()}</p>
                  <p>End: {new Date(session.endTime).toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      session.isActive
                        ? "bg-success/20 text-success"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {session.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {!session.isActive ? (
                    <Button
                      onClick={() => handleStartVoting(session.id)}
                      variant="primary"
                      size="sm"
                      disabled={new Date(session.endTime) < new Date()}
                    >
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEndVoting(session.id)}
                      variant="danger"
                      size="sm"
                    >
                      End
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg">
          <h3 className="font-semibold text-neutral-800">No Sessions Found</h3>
          <p className="text-neutral-500 mt-1">
            Get started by creating a new voting session.
          </p>
        </div>
      )}
    </div>
  );
}
