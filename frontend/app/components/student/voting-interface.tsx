"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";
import { apiClient } from "@/lib/apiClient";
import { FaceCapture } from "./face-capture";

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
  const [faceVerificationRequired, setFaceVerificationRequired] =
    useState(true);
  const [faceVerificationInProgress, setFaceVerificationInProgress] =
    useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Check full verification status (including face verification) when component loads
  useEffect(() => {
    const checkFullVerificationStatus = async () => {
      if (!session?.accessToken) return;
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Student/verification-status`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // If face is already verified, skip face verification requirement
          if (data.faceVerified) {
            setFaceVerificationRequired(false);
          }
        }
      } catch (error) {
        console.error("Failed to check full verification status:", error);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkFullVerificationStatus();
  }, [session]);

  const handleFaceVerificationSuccess = () => {
    setFaceVerificationRequired(false);
    toast.success("Face verification successful! You can now vote.");
    // Reload positions after successful face verification
    onVoteCast();
  };

  const startFaceVerification = () => {
    setFaceVerificationInProgress(true);
  };

  const handleCandidateSelect = (positionId: number, candidateId: number) => {
    setSelectedCandidates((prev) => ({ ...prev, [positionId]: candidateId }));
  };

  const handleVote = async (positionId: number) => {
    if (faceVerificationRequired) {
      toast.error("Please complete face verification first");
      return;
    }

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
          headers: {
            "Content-Type": "application/json",
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
      if ((error as Error).message !== "Session expired") {
        toast.error("An error occurred while casting vote");
      }
    } finally {
      setVotingInProgress((prev) => ({ ...prev, [positionId]: false }));
    }
  };

  if (checkingVerification) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">
          Checking Verification Status
        </h2>
        <p className="text-neutral-500">
          Please wait while we verify your eligibility to vote...
        </p>
      </div>
    );
  }

  if (positions.length === 0 && !faceVerificationRequired) {
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
      {/* Face Verification Required */}
      {faceVerificationRequired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Face Verification Required
              </h3>
              <p className="text-yellow-700">
                For security purposes, you must complete face verification
                before voting.
              </p>
            </div>
            {!faceVerificationInProgress ? (
              <Button
                onClick={startFaceVerification}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Start Face Verification
              </Button>
            ) : (
              <FaceCapture
                matricNumber={session?.user?.matricNumber || ""}
                onSuccess={handleFaceVerificationSuccess}
              />
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">
          Cast Your Vote
        </h1>
        <p className="text-lg text-neutral-600">
          Select your preferred candidate for each position
        </p>
        {faceVerificationRequired && (
          <p className="text-sm text-yellow-600 font-semibold mt-2">
            Complete face verification to enable voting
          </p>
        )}
      </div>

      {/* Show positions only if face verification is complete */}
      {!faceVerificationRequired && positions.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Loading Positions...
          </h2>
          <p className="text-neutral-500">
            Please wait while we load the available positions.
          </p>
        </div>
      )}

      {positions.map((position) => (
        <div
          key={position.id}
          className="bg-purple-50 rounded-xl shadow-md border border-purple-200 p-6 space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-800 uppercase">
              {position.title}
            </h3>
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
                    const isSelected =
                      selectedCandidates[position.id] === candidate.id;

                    return (
                      <div
                        key={candidate.id}
                        onClick={() =>
                          handleCandidateSelect(position.id, candidate.id)
                        }
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
                  disabled={
                    !selectedCandidates[position.id] ||
                    votingInProgress[position.id] ||
                    faceVerificationRequired
                  }
                  className={`px-6 py-2 rounded-lg text-lg ${
                    faceVerificationRequired
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-700 hover:bg-purple-800"
                  } text-white`}
                >
                  {votingInProgress[position.id] ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Casting Vote...
                    </>
                  ) : faceVerificationRequired ? (
                    "Complete Face Verification First"
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
