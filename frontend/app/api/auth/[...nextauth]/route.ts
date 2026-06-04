import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60,
  },

  pages: {
    signIn: '/',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              googleId: user.id,
              image: user.image,
            }),
          });

          if (response.ok) {
            const { token: authToken, user: userData } = await response.json();
            (user as any).role = userData.role;
            (user as any).isActivated = userData.isActivated;
            (user as any).matricNumber = userData.matricNumber;
            (user as any).accessToken = authToken;
            return true;
          } else {
            console.error("Backend rejected Google sign-in");
            return false;
          }
        } catch (error) {
          console.error("Google Sign-in Error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // Set user properties at sign in
      if (user) {
        const u = user as any;
        token.role = u.role;
        token.isActivated = u.isActivated;
        token.matricNumber = u.matricNumber;
        token.accessToken = u.accessToken;
        token.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      }

      if (typeof token.expiresAt === 'number' && Date.now() > token.expiresAt) {
        return {} as JWT; 
      }

      return token;
    },

    async session({ session, token }) {
      if (!token || !token.accessToken) return session;

      session.user.role = token.role as string;
      session.user.isActivated = token.isActivated as boolean;
      session.user.matricNumber = token.matricNumber as string;
      session.accessToken = token.accessToken as string;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
