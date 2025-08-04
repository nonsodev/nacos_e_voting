"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button"; 

interface Position {
  id: number;
  title: string;
  candidates: Candidate[];
}
interface Candidate {
  id: number;
  fullName: string;
  matricNumber?: string;
  imageUrl?: string;
}
interface VoteResults {
  [positionId: number]: {
    [candidateId: number]: number;
  };
}

export function ResultsViewer() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<Position[]>([]);
  const [results, setResults] = useState<VoteResults>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) fetchResults();
  }, [session]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const [positionsResponse, resultsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/positions`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/results`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }),
      ]);
      if (positionsResponse.ok) setPositions(await positionsResponse.json());
      if (resultsResponse.ok) setResults(await resultsResponse.json());
    } catch (error) {
      toast.error("Failed to fetch results");
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalVotesForPosition = (positionId: number): number => {
    return Object.values(results[positionId] || {}).reduce(
      (sum, votes) => sum + votes,
      0
    );
  };

  const getOverallTotalVotes = (): number => {
    return Object.values(results).reduce((total, positionResults) => {
      return (
        total +
        Object.values(positionResults as { [candidateId: number]: number }).reduce(
          (sum, votes) => sum + votes,
          0 
        )
      );
    }, 0);
  };
  

  const getWinner = (position: Position): Candidate | null => {
    if (!position.candidates || position.candidates.length === 0) return null;
    return position.candidates.reduce((winner, candidate) => {
      const winnerVotes = results[position.id]?.[winner.id] || 0;
      const candidateVotes = results[position.id]?.[candidate.id] || 0;
      return candidateVotes > winnerVotes ? candidate : winner;
    }, position.candidates[0]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const overallTotalVotes = getOverallTotalVotes();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800">
          Election Results
        </h1>
        <Button onClick={fetchResults} variant="secondary">
          Refresh Results
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Total Positions
          </h3>
          <p className="text-3xl font-bold text-primary-dark mt-1">
            {positions.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Total Votes Cast
          </h3>
          <p className="text-3xl font-bold text-primary-dark mt-1">
            {overallTotalVotes}
          </p>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <h3 className="font-semibold text-neutral-800">
            No Positions Available
          </h3>
          <p className="text-neutral-500 mt-1">
            Results will be shown here once positions are created.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {positions.map((position) => {
            const totalPositionVotes = getTotalVotesForPosition(position.id);
            const winner = totalPositionVotes > 0 ? getWinner(position) : null;

            return (
              <div
                key={position.id}
                className="bg-white border border-neutral-200 rounded-lg"
              >
                <div className="p-6 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-800">
                    {position.title}
                  </h3>
                  <p className="text-neutral-500">
                    Total Votes: {totalPositionVotes}
                  </p>
                </div>

                {winner && (
                  <div className="p-4 bg-success/10 border-b border-neutral-200">
                    <p className="font-semibold text-success flex items-center">
                      <span className="text-xl mr-2">🏆</span>
                      Winner: {winner.fullName} (
                      {results[position.id]?.[winner.id] || 0} votes)
                    </p>
                  </div>
                )}

                <div className="space-y-4 p-6">
                  {position.candidates.length > 0 ? (
                    position.candidates.map((candidate) => {
                      const votes = results[position.id]?.[candidate.id] || 0;
                      const percentage =
                        totalPositionVotes > 0
                          ? (votes / totalPositionVotes) * 100
                          : 0;
                      const isWinner = winner?.id === candidate.id;

                      return (
                        <div key={candidate.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  candidate.imageUrl || "/default-avatar.png"
                                }
                                alt={candidate.fullName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <h4
                                className={`font-semibold ${
                                  isWinner ? "text-success" : "text-neutral-800"
                                }`}
                              >
                                {candidate.fullName}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-neutral-700">
                                {votes} votes
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                isWinner ? "bg-success" : "bg-primary"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-neutral-500 text-center py-4">
                      No candidates for this position.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
