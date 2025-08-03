"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "../ui/button";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Failed to sign in. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-800 mb-1">
          Sign In
        </h2>
        <p className="text-neutral-500">
          Use your Google account to get started.
        </p>
      </div>

      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        size="lg"
        variant="secondary"
        className="w-full border border-neutral-300"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 12.9927 12.9327 12.045 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
                fill="#4285F4"
              />
              <path
                d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.045 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9873 5.48182 18 9 18Z"
                fill="#34A853"
              />
              <path
                d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275C0.347727 8.45318 0 9.77182 0 11.29C0 12.8082 0.347727 14.1268 0.957275 15.29L3.96409 10.71Z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.57955C10.3218 3.57955 11.5077 4.02409 12.4418 4.92545L15.0218 2.34545C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01273 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <div className="mt-6 text-center text-sm text-neutral-500">
        <p>
          By signing in, you agree to Google's{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-dark hover:underline"
          >
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
