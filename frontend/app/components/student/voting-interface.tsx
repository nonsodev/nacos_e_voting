"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";
import { apiClient } from "@/lib/apiClient";

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



export function VotingInterface({ positions, onVoteCast }: VotingInterfaceProps) {
  const { data: session } = useSession();
  const [selectedCandidates, setSelectedCandidates] = useState<Record<number, number>>({});
  const [votingInProgress, setVotingInProgress] = useState<Record<number, boolean>>({});

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
      const response = await apiClient(
        `${process.env.NEXT_PUBLIC_API_URL}/voting/cast-vote`,
        session?.accessToken,
        {
          method: "POST",
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

  if (positions.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">No Positions Available</h2>
        <p className="text-neutral-500">There are no positions available for voting at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">Cast Your Vote</h1>
        <p className="text-lg text-neutral-600">Select your preferred candidate for each position</p>
      </div>

      {positions.map((position) => (
        
          <div
            key={position.id}
            className="bg-purple-50 rounded-xl shadow-md border border-purple-200 p-6 space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-800 uppercase">{position.title}</h3>
            </div>

            {position.hasVoted ? (
              <div className="bg-green-100 text-green-700 border border-green-300 rounded p-4 text-center font-semibold">
                You have already voted for this position
              </div>
            ) : (
              <div className="space-y-8">
                {/* Candidates Vertical List */}
                <div className="flex flex-col gap-6">
                  {position.candidates
                    .sort((a, b) => a.id - b.id)
                    .map((candidate) => {
                      const isSelected = selectedCandidates[position.id] === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleCandidateSelect(position.id, candidate.id)}
                          className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? "border-purple-600 bg-purple-100 shadow-md scale-105"
                              : "border-neutral-300 hover:border-purple-400 hover:bg-purple-50"
                          }`}
                        >
                          <img
                            src={candidate.imageUrl || "/default-avatar.png"}
                            alt={candidate.fullName}
                            className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-purple-300 object-cover shadow"
                          />
                          <p className="text-lg font-bold text-center text-purple-800">
                            {candidate.fullName.toUpperCase()}
                          </p>
                          {candidate.nickName && (
                            <p className="text-center text-md font-extrabold text-purple-700 mt-1">
                              {candidate.nickName.toUpperCase()}
                            </p>
                          )}
                          <div className="mt-3 flex justify-center">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() =>
                                handleCandidateSelect(position.id, candidate.id)
                              }
                              className="w-5 h-5 accent-purple-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Cast Vote Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleVote(position.id)}
                    disabled={!selectedCandidates[position.id] || votingInProgress[position.id]}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-lg text-lg"
                  >
                    {votingInProgress[position.id] ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Casting Vote...
                      </>
                    ) : (
                      "Cast Vote"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
