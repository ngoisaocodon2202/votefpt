import { cacheLife, cacheTag } from "next/cache";
import { asc, desc } from "drizzle-orm";
import { db, candidates } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { INITIAL_CANDIDATES } from "@/data/initial-candidates";
import type { CandidatesApiResponse, RankedCandidate } from "@/types/voting";

export const CANDIDATES_CACHE_TAG = "candidates";

function getFallbackCandidatesPayload(): CandidatesApiResponse {
  const sorted = [...INITIAL_CANDIDATES].sort((a, b) => {
    const diff = (b.voteCount ?? 0) - (a.voteCount ?? 0);
    if (diff !== 0) return diff;
    return a.studentId.localeCompare(b.studentId);
  });

  const ranked: RankedCandidate[] = sorted.map((item, idx) => ({
    id: `00000000-0000-4000-8000-${String(idx + 1).padStart(12, "0")}`,
    fullName: item.fullName,
    dob: item.dob,
    studentId: item.studentId,
    major: item.major,
    avatarUrl: item.avatarUrl,
    bio: item.bio ?? null,
    voteCount: item.voteCount ?? 0,
    createdAt: null,
    rank: idx + 1,
  }));

  const totalVotes = ranked.reduce((sum, c) => sum + c.voteCount, 0);

  return {
    candidates: ranked,
    totalVotes,
    updatedAt: new Date().toISOString(),
  };
}

export async function getUncachedCandidatesPayload(): Promise<CandidatesApiResponse> {
  await ensureDatabaseInitialized();

  const rows = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.voteCount), asc(candidates.studentId));

  const totalVotes = rows.reduce((sum, c) => sum + (c.voteCount || 0), 0);

  const ranked: RankedCandidate[] = rows.map((row, index) => ({
    id: row.id,
    fullName: row.fullName,
    dob: row.dob,
    studentId: row.studentId,
    major: row.major,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    voteCount: row.voteCount,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    rank: index + 1,
  }));

  return {
    candidates: ranked,
    totalVotes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Runtime-cached leaderboard query using Next.js 16 Cache Components.
 * Uses `seconds` profile (`expire: 60s` < 5m) so `next build` on Vercel never
 * blocks on database connectivity while bursts of runtime requests share cache
 * and invalidate immediately on `revalidateTag("candidates", { expire: 0 })`.
 */
export async function getCachedCandidatesPayload(): Promise<CandidatesApiResponse> {
  "use cache";
  cacheTag(CANDIDATES_CACHE_TAG);
  cacheLife("seconds");

  try {
    return await getUncachedCandidatesPayload();
  } catch (error) {
    console.error("Fallback to showcase candidates (DB unavailable):", error);
    return getFallbackCandidatesPayload();
  }
}
