import { sql } from "drizzle-orm";
import { db, pool, candidates, newsArticles } from "./index";
import { INITIAL_CANDIDATES } from "@/data/initial-candidates";
import { CAMPUS_NEWS } from "@/data/contest-content";

const globalForBootstrap = globalThis as unknown as {
  __fpolyDbInitPromise?: Promise<void> | null;
};

/**
 * Zero-config serverless database bootstrapper for Vercel Free deployments.
 * Verifies required PostgreSQL tables in a single fast metadata check once per warm
 * isolate, and automatically creates schema + initial seed data on a brand-new DB.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  if (!globalForBootstrap.__fpolyDbInitPromise) {
    globalForBootstrap.__fpolyDbInitPromise = (async () => {
      const checkRes = await pool.query<{
        users_reg: string | null;
        candidates_reg: string | null;
        votes_reg: string | null;
        news_reg: string | null;
        media_reg: string | null;
      }>(`
        SELECT
          to_regclass('public.users') AS users_reg,
          to_regclass('public.candidates') AS candidates_reg,
          to_regclass('public.votes') AS votes_reg,
          to_regclass('public.news_articles') AS news_reg,
          to_regclass('public.uploaded_media') AS media_reg
      `);

      const state = checkRes.rows[0];
      const allTablesExist = Boolean(
        state?.users_reg &&
          state?.candidates_reg &&
          state?.votes_reg &&
          state?.news_reg &&
          state?.media_reg
      );

      if (allTablesExist) {
        return;
      }

      // Optional on PG 13+ where gen_random_uuid() is built-in
      await pool
        .query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
        .catch(() => {});

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS candidates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(255) NOT NULL,
          dob DATE NOT NULL,
          student_id VARCHAR(50) UNIQUE NOT NULL,
          major VARCHAR(150) NOT NULL,
          avatar_url TEXT NOT NULL,
          bio TEXT,
          vote_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
          voted_at TIMESTAMPTZ DEFAULT NOW(),
          vote_date DATE DEFAULT CURRENT_DATE
        );

        CREATE INDEX IF NOT EXISTS idx_user_daily_votes ON votes(user_id, vote_date);

        CREATE TABLE IF NOT EXISTS news_articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category VARCHAR(100) NOT NULL,
          campus VARCHAR(120) NOT NULL,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content JSONB NOT NULL DEFAULT '[]'::jsonb,
          published_at VARCHAR(50) NOT NULL,
          read_time VARCHAR(50) NOT NULL,
          image_url TEXT NOT NULL,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS uploaded_media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          filename VARCHAR(255) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          size_bytes INTEGER NOT NULL,
          data_base64 TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Seed initial candidates ONLY when `candidates` table was freshly created
      if (!state?.candidates_reg) {
        const [{ candCount }] = await db
          .select({ candCount: sql<number>`count(*)::int` })
          .from(candidates);

        if (candCount === 0) {
          await db
            .insert(candidates)
            .values(INITIAL_CANDIDATES)
            .onConflictDoNothing();
        }
      }

      // Seed initial campus news ONLY when `news_articles` table is empty
      if (!state?.news_reg) {
        const [{ newsCount }] = await db
          .select({ newsCount: sql<number>`count(*)::int` })
          .from(newsArticles);

        if (newsCount === 0) {
          await db.insert(newsArticles).values(
            CAMPUS_NEWS.map((item, idx) => ({
              category: item.category,
              campus: item.campus,
              title: item.title,
              excerpt: item.excerpt,
              content: item.content,
              publishedAt: item.publishedAt,
              readTime: item.readTime,
              imageUrl: item.imageUrl,
              featured: Boolean(item.featured),
              sortOrder: idx + 1,
            }))
          );
        }
      }
    })().catch((err) => {
      globalForBootstrap.__fpolyDbInitPromise = null;
      throw err;
    });
  }

  return globalForBootstrap.__fpolyDbInitPromise;
}
