import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { pool } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import {
  MAX_DAILY_VOTES,
  getLocalDateString,
  getNextLocalMidnight,
} from "@/lib/timezone";
import { voteBroadcaster } from "@/lib/broadcaster";
import { CANDIDATES_CACHE_TAG } from "@/lib/voting-data";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function maskVoterName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 1) {
    const parts = name.trim().split(/\s+/);
    const lastName = parts[parts.length - 1];
    return `${parts[0][0]}. ${lastName}`;
  }
  if (email) {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 3)}***@${domain || "fpt.edu.vn"}`;
  }
  return "Khán giả FPT";
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: "Vui lòng đăng nhập bằng tài khoản Google để bình chọn.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  let body: { candidateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu yêu cầu không hợp lệ.", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const candidateId = body.candidateId?.trim() || "";
  if (!UUID_REGEX.test(candidateId)) {
    return NextResponse.json(
      { error: "Mã thí sinh không hợp lệ.", code: "INVALID_CANDIDATE_ID" },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseInitialized();
  } catch (dbInitError) {
    console.error("Database initialization failed before vote:", dbInitError);
    return NextResponse.json(
      {
        error: "Chưa kết nối được cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra DATABASE_URL.",
        code: "DB_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  const normalizedEmail = session.user.email.trim().toLowerCase();
  const displayName = session.user.name || normalizedEmail.split("@")[0];
  const avatarUrl = session.user.image || null;
  const todayDate = getLocalDateString();
  const { nextResetAt, msUntilReset } = getNextLocalMidnight();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Ensure user exists and acquire an exclusive row-level lock (FOR UPDATE)
    // to serialize concurrent vote attempts and eliminate race conditions / double-voting.
    await client.query(
      `INSERT INTO users (email, name, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, users.name),
           avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)`,
      [normalizedEmail, displayName, avatarUrl]
    );

    const lockedUserRes = await client.query<{
      id: string;
      email: string;
      name: string | null;
    }>(`SELECT id, email, name FROM users WHERE email = $1 FOR UPDATE`, [
      normalizedEmail,
    ]);

    const dbUser = lockedUserRes.rows[0];
    if (!dbUser) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Không tìm thấy thông tin tài khoản.", code: "USER_ERROR" },
        { status: 500 }
      );
    }

    // 2. Count today's votes inside the row-locked transaction
    const dailyVotesRes = await client.query<{ candidate_id: string }>(
      `SELECT candidate_id FROM votes WHERE user_id = $1 AND vote_date = $2::date`,
      [dbUser.id, todayDate]
    );

    const votesUsedBefore = dailyVotesRes.rows.length;
    if (votesUsedBefore >= MAX_DAILY_VOTES) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: `Bạn đã sử dụng tối đa ${MAX_DAILY_VOTES} lượt bình chọn trong ngày hôm nay.`,
          code: "DAILY_LIMIT_REACHED",
          maxDailyVotes: MAX_DAILY_VOTES,
          votesUsedToday: votesUsedBefore,
          remainingVotes: 0,
          votedCandidateIdsToday: dailyVotesRes.rows.map((r) => r.candidate_id),
          nextResetAt,
          msUntilReset,
        },
        { status: 429 }
      );
    }

    // 3. Atomically increment candidate vote_count and verify candidate existence
    const updatedCandidateRes = await client.query<{
      id: string;
      full_name: string;
      student_id: string;
      vote_count: number;
    }>(
      `UPDATE candidates
       SET vote_count = vote_count + 1
       WHERE id = $1
       RETURNING id, full_name, student_id, vote_count`,
      [candidateId]
    );

    const updatedCandidate = updatedCandidateRes.rows[0];
    if (!updatedCandidate) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Không tìm thấy thí sinh này.", code: "CANDIDATE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4. Record daily vote entry
    await client.query(
      `INSERT INTO votes (user_id, candidate_id, voted_at, vote_date)
       VALUES ($1, $2, NOW(), $3::date)`,
      [dbUser.id, candidateId, todayDate]
    );

    // 5. Compute updated global total inside transaction
    const totalRes = await client.query<{ total: number }>(
      `SELECT COALESCE(SUM(vote_count), 0)::int AS total FROM candidates`
    );
    const totalVotes = totalRes.rows[0]?.total ?? updatedCandidate.vote_count;

    await client.query("COMMIT");

    const votesUsedToday = votesUsedBefore + 1;
    const remainingVotes = Math.max(0, MAX_DAILY_VOTES - votesUsedToday);
    const votedCandidateIdsToday = [
      ...dailyVotesRes.rows.map((r) => r.candidate_id),
      candidateId,
    ];

    // 6. Invalidate Next.js Cache Components tag & broadcast to local SSE listeners
    revalidateTag(CANDIDATES_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    voteBroadcaster.broadcast({
      type: "VOTE_CAST",
      candidateId: updatedCandidate.id,
      candidateName: updatedCandidate.full_name,
      studentId: updatedCandidate.student_id,
      newVoteCount: updatedCandidate.vote_count,
      totalVotes,
      voterHint: maskVoterName(dbUser.name, dbUser.email),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      candidateId: updatedCandidate.id,
      candidateName: updatedCandidate.full_name,
      newVoteCount: updatedCandidate.vote_count,
      totalVotes,
      maxDailyVotes: MAX_DAILY_VOTES,
      votesUsedToday,
      remainingVotes,
      votedCandidateIdsToday,
      nextResetAt,
      msUntilReset,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Vote transaction failed:", error);
    return NextResponse.json(
      {
        error: "Hệ thống đang bận xử lý giao dịch. Vui lòng thử lại!",
        code: "TRANSACTION_ERROR",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
