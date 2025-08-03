import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import the font
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "NACOS LASU E-Voting System",
  description: "Secure student voting platform for Lagos State University, Department of Computer Science",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
