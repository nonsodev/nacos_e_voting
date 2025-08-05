"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { PositionManager } from "../../components/admin/position-manager";
import { CandidateManager } from "../../components/admin/candidate-manager";
import { VotingSessionManager } from "../../components/admin/voting-session-manager";
import { ResultsViewer } from "../../components/admin/results-viewer";
import { Button } from "../../components/ui/button";
import { signOut } from "next-auth/react";

type ActiveTab = "positions" | "candidates" | "sessions" | "results";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("positions");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user && session.user.role !== "admin") {
      router.push("/student/dashboard");
      return;
    }
    setIsLoading(false);
  }, [session, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tabs = [
    { id: "positions", label: "Positions", icon: "📋" },
    { id: "candidates", label: "Candidates", icon: "👥" },
    { id: "sessions", label: "Voting Sessions", icon: "🗳️" },
    { id: "results", label: "Results", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-primary-dark shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/80">Manage the voting system</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center py-2 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary-dark"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "positions" && <PositionManager />}
          {activeTab === "candidates" && <CandidateManager />}
          {activeTab === "sessions" && <VotingSessionManager />}
          {activeTab === "results" && <ResultsViewer />}
        </div>
      </div>
    </div>
  );
}
