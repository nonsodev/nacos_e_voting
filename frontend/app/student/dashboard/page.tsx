"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { VotingInterface } from "../../components/student/voting-interface";
import { Button } from "../../components/ui/button";

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

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingActive, setVotingActive] = useState(false);

  useEffect(() => {
    if (session?.user && !session.user.isActivated) {
      router.push("/student/verification");
      return;
    }
    if (session) {
      fetchVotingData();
    }
  }, [session, router]);

  const fetchVotingData = async () => {
    setIsLoading(true);
    try {
      const statusResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/voting/voting-status`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setVotingActive(statusData.isActive);
        if (statusData.isActive) {
          const positionsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/voting/positions`,
            {
              headers: { Authorization: `Bearer ${session?.accessToken}` },
            }
          );
          if (positionsResponse.ok) {
            setPositions(await positionsResponse.json());
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load voting data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteCast = () => {
    fetchVotingData();
  };

  if (isLoading || !session) {
    // Added !session check for robustness
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              {/* Optional: You can dd NACOS logo here */}
              <h1 className="text-xl font-bold text-primary-dark">
                NACOS LASU E-Voting
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-800">
                  {session.user.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {session.user.matricNumber}
                </p>
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="secondary"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!votingActive ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">
              Voting Is Not Currently Active
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              There is no active voting session at the moment. Please check back
              later. We will notify you when a session begins.
            </p>
          </div>
        ) : (
          <VotingInterface positions={positions} onVoteCast={handleVoteCast} />
        )}
      </main>
    </div>
  );
}
