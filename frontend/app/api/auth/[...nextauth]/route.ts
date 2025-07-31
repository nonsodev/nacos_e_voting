import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Send user data to backend for registration/login
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              googleId: user.id,
              image: user.image,
            }),
          })

          if (response.ok) {
            const userData = await response.json()
            user.role = userData.role
            user.isActivated = userData.isActivated
            user.matricNumber = userData.matricNumber
            return true
          }
        } catch (error) {
          console.error('Sign in error:', error)
        }
      }
      return false
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.isActivated = user.isActivated
        token.matricNumber = user.matricNumber
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role as string
      session.user.isActivated = token.isActivated as boolean
      session.user.matricNumber = token.matricNumber as string
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }