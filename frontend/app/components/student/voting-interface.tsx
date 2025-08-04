"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button"; // <-- 1. IMPORT OUR BUTTON COMPONENT

// --- INTERFACES & LOGIC ARE UNCHANGED ---
interface Position {
  id: number;
  title: string;
  description?: string;
  maxVotes: number;
  hasVoted: boolean;
  candidates: Candidate[];
}
interface Candidate {
  id: number;
  fullName: string;
  matricNumber?: string;
  nickName?: string;
  imageUrl?: string;
}
interface VotingInterfaceProps {
  positions: Position[];
  onVoteCast: () => void;
}

export function VotingInterface({
  positions,
  onVoteCast,
}: VotingInterfaceProps) {
  const { data: session } = useSession();
  const [selectedCandidates, setSelectedCandidates] = useState<
    Record<number, number>
  >({});
  const [votingInProgress, setVotingInProgress] = useState<
    Record<number, boolean>
  >({});

  const handleCandidateSelect = (positionId: number, candidateId: number) => {
    setSelectedCandidates((prev) => ({ ...prev, [positionId]: candidateId }));
  };

  const handleVote = async (positionId: number) => {
    const candidateId = selectedCandidates[positionId];
    if (!candidateId) {
      toast.error("Please select a candidate first");
      return;
    }
    setVotingInProgress((prev) => ({ ...prev, [positionId]: true }));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/voting/cast-vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ positionId, candidateId }),
        }
      );
      if (response.ok) {
        toast.success("Vote cast successfully!");
        onVoteCast();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cast vote");
      }
    } catch (error) {
      toast.error("An error occurred while casting vote");
    } finally {
      setVotingInProgress((prev) => ({ ...prev, [positionId]: false }));
    }
  };
  // --- END OF LOGIC ---

  if (positions.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">
          No Positions Available
        </h2>
        <p className="text-neutral-500">
          There are no positions available for voting at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Change 1: Updated main title colors */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-dark mb-2">
          Cast Your Vote
        </h1>
        <p className="text-lg text-neutral-600">
          Select your preferred candidate for each position
        </p>
      </div>

      {positions.map((position) => (
        // Change 2: Wrapped each position in a consistent, styled card
        <div
          key={position.id}
          className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 md:p-8"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-neutral-800">
              {position.title}
            </h3>
            {position.description && (
              <p className="text-neutral-500 mt-1">{position.description}</p>
            )}
          </div>

          {position.hasVoted ? (
            // Change 3: Restyled the "voted" banner with our success colors
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-success mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-success font-semibold">
                  You have already voted for this position
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Change 4: Redesigned the candidate selection grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {position.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${
                      selectedCandidates[position.id] === candidate.id
                        ? "border-primary bg-primary/10" // Selected state
                        : "border-neutral-200 bg-white hover:border-primary/50" // Default state
                    }`}
                    onClick={() =>
                      handleCandidateSelect(position.id, candidate.id)
                    }
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`position-${position.id}`}
                        checked={
                          selectedCandidates[position.id] === candidate.id
                        }
                        onChange={() =>
                          handleCandidateSelect(position.id, candidate.id)
                        }
                        className="h-5 w-5 mr-4 accent-primary" // Styled the radio button
                      />
                      <div className="flex-1 flex items-center">
                        {candidate.imageUrl && (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.fullName}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-neutral-800">
                            {candidate.fullName}
                          </h4>
                          {candidate.nickName && (
                            <p className="text-sm text-neutral-500">
                              {candidate.nickName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Change 5: Used our Button for the final action */}
              <div className="flex justify-end border-t border-neutral-200 pt-6">
                <Button
                  onClick={() => handleVote(position.id)}
                  disabled={
                    !selectedCandidates[position.id] ||
                    votingInProgress[position.id]
                  }
                  size="lg"
                >
                  {votingInProgress[position.id] ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Casting Vote...
                    </>
                  ) : (
                    "Cast Vote for this Position"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
