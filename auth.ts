import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  logger: {
    error(error) { console.error("[auth error]", error); },
  },
  providers: [
    Google({ checks: ["none"] }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        return user ?? null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in", newUser: "/onboarding" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/sign-in", "/sign-up", "/api/auth", "/onboarding"];
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (!isLoggedIn && !isPublic) return Response.redirect(new URL("/sign-in", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
