"use client";

import { useState, useRef, useCallback, useEffect } from "react"; 
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";

interface FaceCaptureProps {
  matricNumber: string;
  onSuccess: () => void;
}

export function FaceCapture({ matricNumber, onSuccess }: FaceCaptureProps) {
  const { data: session } = useSession();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    const enableStream = async () => {
      if (isCapturing) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
            };
          }
        } catch (error) {
          toast.error(
            "Failed to access camera. Please allow camera permissions."
          );
          setIsCapturing(false); 
        }
      }
    };

    enableStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [isCapturing]);

  const startCamera = () => {
    setCapturedImage(null);
    setIsCapturing(true);
  };

  const stopCamera = () => {
    setIsCapturing(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera feed is not available. Please try again.");
      return;
    }

    const context = canvas.getContext("2d");
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageData);
      stopCamera(); 
    }
  }, [videoRef, canvasRef]);

  const retakePhoto = () => {
    startCamera();
  };

  const verifyFace = async () => {
    if (!capturedImage) {
      toast.error("Please capture a photo first");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("File", blob, "face.jpg");
      formData.append("matricNumber", matricNumber);
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/verify-face`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
          body: formData,
        }
      );
      if (verifyResponse.ok) {
        toast.success("Face verification successful!");
        onSuccess();
      } else {
        const error = await verifyResponse
          .json()
          .catch(() => ({ message: "Verification failed" }));
        toast.error(error.message || "Verification failed");
      }
    } catch (error) {
      console.error("An error occurred during verification:", error);
      toast.error("An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
          <h3 className="font-semibold text-secondary-dark mb-2">
            Instructions:
          </h3>
          <ul className="text-sm text-secondary-dark/80 space-y-1 list-disc list-inside">
            <li>Look directly at the camera</li>
            <li>Ensure your face has good, even lighting</li>
            <li>Remove glasses or face coverings if possible</li>
            <li>Keep your face centered in the frame</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-6">
        {!isCapturing && !capturedImage && (
          <div className="text-center space-y-4">
            <div className="w-80 h-60 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center">
              <svg
                className="w-16 h-16 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <Button onClick={startCamera} size="lg">
              Start Camera
            </Button>
          </div>
        )}
        {isCapturing && (
          <div className="text-center">
            <div className="relative w-80 h-60">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full bg-neutral-900 rounded-lg object-cover"
              />
              <div className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none" />
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={stopCamera} variant="secondary">
                Cancel
              </Button>
              <Button onClick={capturePhoto}>Capture Photo</Button>
            </div>
          </div>
        )}
        {capturedImage && (
          <div className="text-center">
            <div className="relative w-80 h-60">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <Button
                onClick={retakePhoto}
                variant="secondary"
                disabled={isVerifying}
              >
                Retake Photo
              </Button>
              <Button onClick={verifyFace} disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Verify Face"
                )}
              </Button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
