import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getCachedCandidatesPayload } from "@/lib/voting-data";

export async function GET() {
  await connection();

  try {
    const payload = await getCachedCandidatesPayload();

    return NextResponse.json(payload, {
      headers: {
        // Edge-cached for 4s with 20s SWR to protect Vercel Free & Neon/Supabase quotas
        // during high-traffic voting bursts while keeping leaderboard real-time.
        "Cache-Control": "public, s-maxage=4, stale-while-revalidate=20",
      },
    });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách thí sinh." },
      { status: 500 }
    );
  }
}
