import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db, candidates } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { CANDIDATES_CACHE_TAG } from "@/lib/voting-data";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập quản trị." },
      { status: 401 }
    );
  }

  try {
    await ensureDatabaseInitialized();

    const { id } = await context.params;
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

    if (!fullName || !studentId || !dob || !major || !avatarUrl) {
      return NextResponse.json(
        {
          error:
            "Vui lòng điền đầy đủ Họ tên, MSSV, Ngày sinh, Chuyên ngành và Ảnh đại diện.",
        },
        { status: 400 }
      );
    }

    const duplicate = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(and(eq(candidates.studentId, studentId), ne(candidates.id, id)))
      .limit(1);

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: `Mã số sinh viên ${studentId} đang thuộc về thí sinh khác.` },
        { status: 409 }
      );
    }

    const updateValues: {
      fullName: string;
      studentId: string;
      dob: string;
      major: string;
      avatarUrl: string;
      bio: string | null;
      voteCount?: number;
    } = {
      fullName,
      studentId,
      dob,
      major,
      avatarUrl,
      bio: bio || null,
    };

    if (typeof body.voteCount === "number" && Number.isFinite(body.voteCount)) {
      updateValues.voteCount = Math.max(0, Math.floor(body.voteCount));
    }

    const [updated] = await db
      .update(candidates)
      .set(updateValues)
      .where(eq(candidates.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ thí sinh." },
        { status: 404 }
      );
    }

    revalidateTag(CANDIDATES_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({
      candidate: {
        ...updated,
        createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật thông tin thí sinh." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập quản trị." },
      { status: 401 }
    );
  }

  try {
    await ensureDatabaseInitialized();

    const { id } = await context.params;
    const [deleted] = await db
      .delete(candidates)
      .where(eq(candidates.id, id))
      .returning({ id: candidates.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ thí sinh." },
        { status: 404 }
      );
    }

    revalidateTag(CANDIDATES_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("Delete candidate error:", error);
    return NextResponse.json(
      { error: "Không thể xóa hồ sơ thí sinh." },
      { status: 500 }
    );
  }
}
