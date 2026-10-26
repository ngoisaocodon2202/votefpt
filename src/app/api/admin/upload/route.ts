import { NextRequest, NextResponse } from "next/server";
import { db, uploadedMedia } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Keep safely below Vercel Hobby's 4.5MB Serverless Function request payload limit.
// Client-side WebP compression automatically shrinks raw camera photos (~8MB) to ~150KB first.
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Phiên đăng nhập quản trị đã hết hạn." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp hình ảnh hợp lệ." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Dung lượng ảnh sau nén tối đa là 4MB." },
        { status: 400 }
      );
    }

    await ensureDatabaseInitialized();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseSlug =
      file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "fpoly";

    const safeFilename = `${baseSlug}${ext}`;

    const [created] = await db
      .insert(uploadedMedia)
      .values({
        filename: safeFilename,
        mimeType: file.type,
        sizeBytes: buffer.byteLength,
        dataBase64: buffer.toString("base64"),
      })
      .returning({ id: uploadedMedia.id });

    return NextResponse.json({
      url: `/api/media/${created.id}`,
    });
  } catch (error) {
    console.error("Admin image upload error:", error);
    return NextResponse.json(
      {
        error:
          "Không thể lưu ảnh lên hệ thống. Vui lòng kiểm tra kết nối DATABASE_URL.",
      },
      { status: 500 }
    );
  }
}
