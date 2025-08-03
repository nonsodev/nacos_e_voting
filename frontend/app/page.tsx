"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "./components/auth/login-form";
import { LoadingSpinner } from "./components/ui/loading-spinner";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      if (session.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (session.user.isActivated) {
        router.push("/student/dashboard");
      } else {
        router.push("/student/verification");
      }
    }
  }, [session, router]);

  if (status === "loading" || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner />
      </div>
    );
  }

  // No session, show the new and improved Login Page
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
     
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-neutral-200">
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-primary-dark mb-2">
            NACOS LASU E-Voting
          </h1>
          <p className="text-neutral-600">
            Secure, reliable, and transparent student voting
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
