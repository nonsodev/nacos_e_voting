"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voting/cast-vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ positionId, candidateId }),
      });

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
              {position.candidates.sort((a, b) => a.id - b.id).map((candidate) => {
                const isSelected = selectedCandidates[position.id] === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => handleCandidateSelect(position.id, candidate.id)}
                    className={`rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 text-center ${
                      isSelected ? "border-purple-600 bg-purple-100" : "border-purple-200 hover:border-purple-400"
                    }`}
                  >
                    {candidate.imageUrl && (
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.fullName}
                        className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border border-purple-300"
                      />
                    )}
                    <p className="text-md font-medium text-purple-900">
                      NAME: {candidate.fullName.trim().toUpperCase()}
                    </p>
                    <label className="inline-flex items-center mt-4 space-x-2 text-purple-800 font-semibold">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleCandidateSelect(position.id, candidate.id)}
                        className="form-radio h-5 w-5 text-purple-600"
                      />
                      <span>
                        VOTE {candidate.nickName?.toUpperCase() || candidate.fullName.split(" ")[0].toUpperCase()} FOR {position.title.toUpperCase()}
                      </span>
                    </label>
                  </div>
                );
              })}

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
