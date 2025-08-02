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
            const { token: authToken, user: userData } = await response.json()
            user.role = userData.role
            user.isActivated = userData.isActivated
            user.matricNumber = userData.matricNumber
            user.token = authToken // Store the JWT token
            return true
          }
        } catch (error) {
          console.error('Sign in error:', error)
        }
      }
      return false
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.isActivated = user.isActivated
        token.matricNumber = user.matricNumber
        token.accessToken = user.token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.role = token.role
        session.user.isActivated = token.isActivated
        session.user.matricNumber = token.matricNumber
        session.accessToken = token.accessToken
      }
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