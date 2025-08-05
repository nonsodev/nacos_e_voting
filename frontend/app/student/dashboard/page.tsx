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
    const checkVerificationStatus = async () => {
      try {
        console.log("Session in checkVerificationStatus:", session);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Student/verification-status`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }
        );

        console.log("Raw response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error("Verification API error:", text);
          router.push("/student/verification");
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but got:", contentType, text);
          router.push("/student/verification");
          return;
        }

        const data = await res.json();
        console.log("Verification status:", data);

        if (data.isActivated) {
          setIsLoading(false);
          fetchVotingData();
        } else {
          router.push("/student/verification");
        }
      } catch (err) {
        console.error("Failed to check verification status:", err);
        router.push("/student/verification");
      }
    };

    if (session?.user) {
      checkVerificationStatus();
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
  console.log(
    "Positions right before VotingInterface:",
    positions.map((p) => p.title)
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* THIS IS THE NEW PURPLE HEADER */}
      <header className="bg-primary-dark shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Branded Title */}
            <div className="flex items-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h1 className="text-xl font-bold text-white">
                NACOS LASU E-Voting
              </h1>
            </div>

            {/* User Info and Sign Out Button */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {session.user.name}
                </p>
                <p className="text-xs text-white/70">
                  {session.user.matricNumber}
                </p>
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="ghost"
                size="sm"
                className="text-white/70 border-2 border-white/30 transition-all hover:bg-danger hover:text-white hover:border-danger"
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
