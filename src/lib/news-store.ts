import { cacheLife, cacheTag } from "next/cache";
import { asc, desc } from "drizzle-orm";
import { db, newsArticles } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { CAMPUS_NEWS, type NewsArticle } from "@/data/contest-content";

export const NEWS_CACHE_TAG = "news";

export async function ensureNewsArticlesTable(): Promise<void> {
  await ensureDatabaseInitialized();
}

export async function getAllNewsArticles(): Promise<NewsArticle[]> {
  try {
    await ensureDatabaseInitialized();
    const rows = await db
      .select()
      .from(newsArticles)
      .orderBy(
        desc(newsArticles.featured),
        asc(newsArticles.sortOrder),
        desc(newsArticles.createdAt)
      );

    return rows.map((row) => ({
      id: row.id,
      category: row.category,
      campus: row.campus,
      title: row.title,
      excerpt: row.excerpt,
      content: Array.isArray(row.content) ? row.content : [],
      publishedAt: row.publishedAt,
      readTime: row.readTime,
      imageUrl: row.imageUrl,
      featured: row.featured,
    }));
  } catch (error) {
    console.error("Fallback to static CAMPUS_NEWS:", error);
    return CAMPUS_NEWS;
  }
}

/**
 * Runtime-cached campus news articles (`expire: 240s` < 5m keeps build-time
 * prerendering independent of DB availability on Vercel, while caching across
 * runtime visits and invalidating immediately via `revalidateTag("news", ...)`).
 */
export async function getCachedNewsArticles(): Promise<NewsArticle[]> {
  "use cache";
  cacheTag(NEWS_CACHE_TAG);
  cacheLife({
    stale: 60,
    revalidate: 60,
    expire: 240,
  });

  return getAllNewsArticles();
}
