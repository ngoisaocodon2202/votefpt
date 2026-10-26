import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "fpoly_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSigningSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "fpt-inspiring-youth-voting-2026-super-secret-key-9f8e7d6c5b4a"
  );
}

export function getAdminCredentials(): { username: string; password: string } {
  return {
    username: (process.env.ADMIN_USERNAME || "admin").trim(),
    password: process.env.ADMIN_PASSWORD || "fpoly2026",
  };
}

function signPayload(payloadBase64: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export function createAdminSessionToken(username: string): string {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payloadBase64 = Buffer.from(
    JSON.stringify({ u: username, role: "admin", exp }),
    "utf8"
  ).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null
): { username: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signPayload(payloadBase64);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as { u?: string; role?: string; exp?: number };

    if (
      parsed.role !== "admin" ||
      typeof parsed.u !== "string" ||
      typeof parsed.exp !== "number" ||
      Date.now() > parsed.exp
    ) {
      return null;
    }

    return { username: parsed.u };
  } catch {
    return null;
  }
}

export async function getAuthenticatedAdmin(): Promise<{
  username: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
