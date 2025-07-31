import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LASU E-Voting System',
  description: 'Secure student voting platform for Lagos State University',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}