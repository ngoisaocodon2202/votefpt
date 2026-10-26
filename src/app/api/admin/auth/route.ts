import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminCookieOptions,
  getAdminCredentials,
  getAuthenticatedAdmin,
} from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, username: admin.username });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const inputUsername = (body.username || "").trim();
    const inputPassword = body.password || "";
    const expected = getAdminCredentials();

    if (
      inputUsername !== expected.username ||
      inputPassword !== expected.password
    ) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu quản trị không chính xác." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(expected.username);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());

    return NextResponse.json({
      authenticated: true,
      username: expected.username,
    });
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu đăng nhập không hợp lệ." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
