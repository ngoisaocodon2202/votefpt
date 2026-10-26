import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema";

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "postgresql://postgres:220206@localhost:5432/fpt_voting";

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

function buildPoolConfig(rawUrl: string): PoolConfig {
  let normalizedUrl = rawUrl.trim();
  let isLocalHost = false;

  try {
    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.toLowerCase();
    isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local");

    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

    if (!isLocalHost && sslMode !== "disable" && sslMode !== "verify-full") {
      // Ensure pg v8 compatibility with Neon, Supabase Pooler, Render, Aiven & Vercel Postgres
      // without triggering SSL chain errors or pg-connection-string deprecation warnings.
      if (!parsed.searchParams.has("uselibpqcompat")) {
        parsed.searchParams.set("uselibpqcompat", "true");
      }
      if (!sslMode) {
        parsed.searchParams.set("sslmode", "require");
      }
      normalizedUrl = parsed.toString();
    }
  } catch {
    // Fallback to raw connection string if custom DSN format is used
  }

  return {
    connectionString: normalizedUrl,
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: isServerless ? 10000 : 30000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: isServerless,
  };
}

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool = globalForDb.pgPool ?? new Pool(buildPoolConfig(rawConnectionString));

globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
export * from "./schema";
