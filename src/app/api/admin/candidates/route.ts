import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db, candidates } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { CANDIDATES_CACHE_TAG } from "@/lib/voting-data";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập quản trị." },
      { status: 401 }
    );
  }

  await ensureDatabaseInitialized();

  const rows = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.voteCount), asc(candidates.studentId));

  return NextResponse.json(
    {
      candidates: rows.map((row, idx) => ({
        ...row,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        rank: idx + 1,
      })),
    },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    }
  );
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập quản trị." },
      { status: 401 }
    );
  }

  try {
    await ensureDatabaseInitialized();

    const body = (await req.json()) as {
      fullName?: string;
      studentId?: string;
      dob?: string;
      major?: string;
      avatarUrl?: string;
      bio?: string;
      voteCount?: number;
    };

    const fullName = (body.fullName || "").trim();
    const studentId = (body.studentId || "").trim().toUpperCase();
    const dob = (body.dob || "").trim();
    const major = (body.major || "").trim();
    const avatarUrl = (body.avatarUrl || "").trim();
    const bio = (body.bio || "").trim();
    const voteCount = Math.max(0, Math.floor(Number(body.voteCount ?? 0) || 0));

    if (!fullName || !studentId || !dob || !major || !avatarUrl) {
      return NextResponse.json(
        {
          error:
            "Vui lòng điền đầy đủ Họ tên, MSSV, Ngày sinh, Chuyên ngành và Ảnh đại diện.",
        },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.studentId, studentId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Mã số sinh viên ${studentId} đã tồn tại trong hệ thống.` },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(candidates)
      .values({
        fullName,
        studentId,
        dob,
        major,
        avatarUrl,
        bio: bio || null,
        voteCount,
      })
      .returning();

    revalidateTag(CANDIDATES_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({
      candidate: {
        ...created,
        createdAt: created.createdAt ? created.createdAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Create candidate error:", error);
    return NextResponse.json(
      { error: "Không thể tạo hồ sơ thí sinh." },
      { status: 500 }
    );
  }
}
