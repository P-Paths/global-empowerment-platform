import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";

const handler = NextAuth({
  providers: [
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
      authorization: {
        params: {
          scope: "public_profile,email,publish_actions"
        }
      }
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.name = token.name ?? (profile as any).name;
        token.email = token.email ?? (profile as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = token.provider;
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
