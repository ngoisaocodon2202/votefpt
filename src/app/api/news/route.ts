import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getCachedNewsArticles } from "@/lib/news-store";

export async function GET() {
  await connection();
  const articles = await getCachedNewsArticles();
  return NextResponse.json(
    { articles, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
