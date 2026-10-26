import "dotenv/config";
import { notInArray, sql } from "drizzle-orm";
import { db, pool, candidates, newsArticles } from "./index";
import { INITIAL_CANDIDATES } from "../data/initial-candidates";
import { CAMPUS_NEWS } from "../data/contest-content";

async function main() {
  console.log(
    "🚀 Initializing FPT Polytechnic Đồng Nai Voting PostgreSQL schema & seed data..."
  );

  await db
    .execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
    .catch(() => {});

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      student_id VARCHAR(50) UNIQUE NOT NULL,
      major VARCHAR(150) NOT NULL,
      avatar_url TEXT NOT NULL,
      bio TEXT,
      vote_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
      voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      vote_date DATE DEFAULT CURRENT_DATE
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_user_daily_votes ON votes(user_id, vote_date);
  `);

  await db.execute(sql`
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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS uploaded_media (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes INTEGER NOT NULL,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const activeIds = INITIAL_CANDIDATES.map((c) => c.studentId);
  await db
    .delete(candidates)
    .where(notInArray(candidates.studentId, activeIds));

  for (const item of INITIAL_CANDIDATES) {
    await db
      .insert(candidates)
      .values(item)
      .onConflictDoUpdate({
        target: candidates.studentId,
        set: {
          fullName: item.fullName,
          dob: item.dob,
          major: item.major,
          avatarUrl: item.avatarUrl,
          bio: item.bio,
          voteCount: item.voteCount,
        },
      });
  }

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

  console.log(
    `✅ Successfully seeded ${INITIAL_CANDIDATES.length} candidates & news articles for FPT Polytechnic Đồng Nai!`
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Seed error:", err);
  await pool.end();
  process.exit(1);
});
