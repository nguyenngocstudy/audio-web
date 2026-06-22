import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const [u] = await db.select().from(users)
          .where(eq(users.email, creds.email as string)).limit(1);
        if (!u?.passwordHash) return null;
        const ok = await bcrypt.compare(creds.password as string, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, email: u.email, name: u.name, image: u.avatarUrl };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        if (account?.provider === "google" && user.email) {
          const [existing] = await db.select({ id: users.id }).from(users)
            .where(eq(users.email, user.email)).limit(1);
          if (existing) token.id = existing.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await db.select({ id: users.id }).from(users)
          .where(eq(users.email, user.email)).limit(1);
        if (!existing.length) {
          await db.insert(users).values({
            email: user.email,
            name: user.name ?? null,
            avatarUrl: user.image ?? null,
          });
        }
      }
      return true;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
});
