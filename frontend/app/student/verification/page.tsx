"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DocumentUpload } from "../../components/student/document-upload";
import { FaceCapture } from "../../components/student/face-capture";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type VerificationStep = "matric" | "document" | "face" | "complete";

export default function VerificationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<VerificationStep>("matric");
  const [matricNumber, setMatricNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMatricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim() || !fullName.trim()) {
      toast.error("Please enter both your full name and matriculation number.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/update-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ matricNumber, fullName }),
        }
      );
      if (response.ok) {
        setCurrentStep("document");
        toast.success("Details saved successfully");
      } else {
        toast.error("Failed to save details");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUploaded = () => setCurrentStep("face");
  const handleFaceVerified = () => {
    setCurrentStep("complete");
    toast.success("Account verification complete!");
    setTimeout(() => {
      router.push("/student/dashboard");
    }, 2000);
  };

  const steps = [
    { key: "matric", label: "Your Details" },
    { key: "document", label: "Document Upload" },
    { key: "face", label: "Face Verification" },
  ];
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  const renderStepContent = () => {
    switch (currentStep) {
      case "matric":
        return (
          <>
            <h2 className="text-2xl font-bold text-neutral-800 text-center mb-1">
              Enter Your Details
            </h2>
            <p className="text-neutral-500 text-center mb-6">
              This information must match your course form.
            </p>
            <form onSubmit={handleMatricSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Adeola Adeolu Adeyemi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Matriculation Number *
                </label>
                <Input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  placeholder="e.g., 230591001"
                  required
                />
              </div>
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" /> Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>
          </>
        );
      case "document":
        return (
          <DocumentUpload
            matricNumber={matricNumber}
            onSuccess={handleDocumentUploaded}
          />
        );
      case "face":
        return (
          <FaceCapture
            matricNumber={matricNumber}
            onSuccess={handleFaceVerified}
          />
        );
      case "complete":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-800 mb-2">
              Verification Complete!
            </h2>
            <p className="text-neutral-600 mb-4">
              You will be redirected to your dashboard shortly.
            </p>
            <LoadingSpinner className="mx-auto" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 bg-primary-dark shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 1. Branded Title */}
            <div className="flex items-center space-x-3">
              {/* A simple book icon, now in white */}
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
              <h1 className="text-xl font-bold text-white">LASU E-Voting</h1>
            </div>

            {/* 2. Styled Sign Out Button for Dark Background */}
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="danger"
              className="text-white border-2 border-white/50 hover:bg-white/20 hover:border-white"
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">
            Account Verification
          </h1>
          <p className="text-neutral-500 mt-1">
            Complete these steps to activate your voting account.
          </p>
        </div>

        <div className="mb-8 p-4 bg-white border border-neutral-200 rounded-lg">
          <ol className="flex items-center w-full">
            {steps.map((step, index) => (
              <li
                key={step.key}
                className={`flex w-full items-center ${
                  index < steps.length - 1
                    ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block"
                    : ""
                } ${
                  index <= currentStepIndex
                    ? "after:border-primary"
                    : "after:border-neutral-200"
                }`}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0"
                  style={{
                    backgroundColor:
                      index <= currentStepIndex
                        ? "var(--color-primary)"
                        : "var(--color-neutral-200)",
                    color:
                      index <= currentStepIndex
                        ? "white"
                        : "var(--color-neutral-600)",
                  }}
                >
                  {index < currentStepIndex ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 md:p-8">
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
}
