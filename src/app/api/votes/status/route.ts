import { NextResponse } from "next/server";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db, users, votes } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { and, eq } from "drizzle-orm";
import {
  MAX_DAILY_VOTES,
  getLocalDateString,
  getNextLocalMidnight,
} from "@/lib/timezone";

export async function GET() {
  await connection();

  const today = getLocalDateString();
  const { nextResetAt, msUntilReset } = getNextLocalMidnight();

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          maxDailyVotes: MAX_DAILY_VOTES,
          votesUsedToday: 0,
          remainingVotes: MAX_DAILY_VOTES,
          votedCandidateIdsToday: [] as string[],
          todayDate: today,
          nextResetAt,
          msUntilReset,
        },
        {
          headers: { "Cache-Control": "private, no-store, max-age=0" },
        }
      );
    }

    await ensureDatabaseInitialized();

    const normalizedEmail = session.user.email.trim().toLowerCase();
    let dbUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!dbUser) {
      const [inserted] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          name: session.user.name || normalizedEmail.split("@")[0],
          avatarUrl: session.user.image || null,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: session.user.name || normalizedEmail.split("@")[0],
          },
        })
        .returning();
      dbUser = inserted;
    }

    const todaysVotes = await db
      .select({ candidateId: votes.candidateId })
      .from(votes)
      .where(and(eq(votes.userId, dbUser.id), eq(votes.voteDate, today)));

    const votesUsedToday = todaysVotes.length;
    const remainingVotes = Math.max(0, MAX_DAILY_VOTES - votesUsedToday);
    const votedCandidateIdsToday = todaysVotes
      .map((v) => v.candidateId)
      .filter((id): id is string => Boolean(id));

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
        },
        maxDailyVotes: MAX_DAILY_VOTES,
        votesUsedToday,
        remainingVotes,
        votedCandidateIdsToday,
        todayDate: today,
        nextResetAt,
        msUntilReset,
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Failed to fetch vote status:", error);
    return NextResponse.json(
      { error: "Không thể kiểm tra trạng thái lượt bình chọn." },
      { status: 500 }
    );
  }
}
