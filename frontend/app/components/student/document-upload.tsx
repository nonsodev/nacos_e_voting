"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";
import { apiClient } from "@/lib/apiClient";

interface DocumentUploadProps {
  matricNumber: string;
  fullName: string;
  onSuccess: () => void;
}

export function DocumentUpload({
  matricNumber,
  fullName,
  onSuccess,
}: DocumentUploadProps) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setUploadedFile(file);
  };


  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error("Please select a file first");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("File", uploadedFile);
      formData.append("matricNumber", matricNumber);
      formData.append("fullName", fullName);


      const response = await apiClient(
        `${process.env.NEXT_PUBLIC_API_URL}/student/upload-document`,
        session?.accessToken,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Document verified successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Upload failed");
      }
    } catch (error) {
      if ((error as Error).message !== "Session expired") {
        toast.error("An error occurred during upload");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- UI is unchanged ---
  return (
    <div>
      <div className="mb-6">
        <div className="bg-primary/10 border border-primary-light rounded-lg p-4">
          <h3 className="font-semibold text-primary-dark mb-2">
            Requirements:
          </h3>
          <ul className="text-sm text-primary-dark/80 space-y-1 list-disc list-inside">
            <li>PDF format only</li>
            <li>Maximum file size: 10MB</li>
            <li>Must contain your full name and matric number</li>
            <li>Must be clear and readable</li>
          </ul>
        </div>
      </div>
      <div
        className="relative border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center mb-6 transition-colors duration-200 hover:border-primary hover:bg-neutral-50 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploadedFile ? (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-neutral-800">
                {uploadedFile.name}
              </p>
              <p className="text-sm text-neutral-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              Choose a different file
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-800">
                Upload your Course Form
              </p>
              <p className="text-neutral-500 mb-4">
                Click to browse or drag & drop
              </p>
              <Button variant="secondary" size="default">
                Choose File
              </Button>
            </div>
          </div>
        )}
      </div>
      {uploadedFile && (
        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={isUploading} size="lg">
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Verifying Document...</span>
              </>
            ) : (
              "Upload & Verify"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
