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

  const handleMatricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber.trim() || !fullName.trim()) {
      toast.error("Please enter both your full name and matriculation number.");
      return;
    }
    setCurrentStep("document");
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
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setCurrentStep("matric")}
            >
              ← Edit Name or Matric Number
            </Button>
            <DocumentUpload
              matricNumber={matricNumber}
              fullName={fullName}
              onSuccess={handleDocumentUploaded}
            />
          </>
        );
      case "face":
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setCurrentStep("matric")}
            >
              ← Edit Name or Matric Number
            </Button>
            <FaceCapture
              matricNumber={matricNumber}
              onSuccess={handleFaceVerified}
            />
          </>
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
              <h1 className="text-xl font-bold text-white">LASU E-Voting</h1>
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

        {/* --- THIS IS THE NEW, IMPROVED STEPPER UI --- */}
        <div className="w-full mb-12 px-2">
          <div className="flex">
            {steps.map((step, index) => (
              <div key={step.key} className="w-1/3">
                <div
                  className={`relative mb-2 ${
                    index <= currentStepIndex
                      ? "text-primary-dark"
                      : "text-neutral-500"
                  }`}
                >
                  {/* The connector line. It doesn't show for the first item. */}
                  {index > 0 && (
                    <div
                      className="absolute w-full top-1/2 -mt-px h-1"
                      style={{
                        left: "-50%",
                        backgroundColor:
                          index <= currentStepIndex
                            ? "#8B5CF6" /* Purple */
                            : "#e0e0e0" /* Gray */,
                      }}
                    />
                  )}

                  <div
                    className={`w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center relative z-10 ${
                      index <= currentStepIndex
                        ? "bg-primary text-white"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
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
                </div>
                <div
                  className={`text-center text-xs md:text-sm font-semibold ${
                    index <= currentStepIndex
                      ? "text-primary-dark"
                      : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 md:p-8">
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
}
