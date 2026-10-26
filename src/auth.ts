import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, users } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { eq } from "drizzle-orm";

async function upsertDatabaseUser(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  await ensureDatabaseInitialized();
  const normalizedEmail = profile.email.trim().toLowerCase();
  const [upserted] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: profile.name || normalizedEmail.split("@")[0],
      avatarUrl: profile.image || null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: profile.name || normalizedEmail.split("@")[0],
        avatarUrl: profile.image || null,
      },
    })
    .returning();

  return upserted;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fpt-inspiring-youth-voting-2026-super-secret-key-9f8e7d6c5b4a",
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      return Boolean(user?.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const dbUser = await upsertDatabaseUser({
            email: user.email,
            name: user.name,
            image: user.image,
          });
          token.dbUserId = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.avatarUrl;
        } catch (error) {
          console.error("NextAuth user upsert warning:", error);
          token.email = user.email.trim().toLowerCase();
          token.name = user.name;
          token.picture = user.image;
        }
      } else if (token.email && !token.dbUserId) {
        try {
          await ensureDatabaseInitialized();
          const existing = await db.query.users.findFirst({
            where: eq(users.email, String(token.email).toLowerCase()),
          });
          if (existing) {
            token.dbUserId = existing.id;
          }
        } catch {
          // Defer DB lookup if database is momentarily waking up
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.dbUserId as string) || "";
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
        session.user.image =
          (token.picture as string | undefined) || session.user.image;
      }
      return session;
    },
  },
});
