import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'

const hasGithub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET)
const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const hasEmail = !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM)

const handler = NextAuth({
  providers: [
    ...(hasGithub
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(hasEmail
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER!,
            from: process.env.EMAIL_FROM!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider
        if (profile && 'email' in profile) token.email = profile.email as string
        if (profile && 'name' in profile) token.name = profile.name as string
      }
      return token
    },
    async session({ session, token }) {
      // Expose a signed token to the client via session for API calls (optional)
      // Note: next-auth's JWT is server-side by default; clients can still rely on cookies
      ;(session as any).token = token
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
