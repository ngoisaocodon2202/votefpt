import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, ne } from "drizzle-orm";
import { db, newsArticles } from "@/db";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { NEWS_CACHE_TAG, ensureNewsArticlesTable } from "@/lib/news-store";

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
    await ensureNewsArticlesTable();
    const { id } = await context.params;

    const body = (await req.json()) as {
      category?: string;
      campus?: string;
      title?: string;
      excerpt?: string;
      content?: string[] | string;
      publishedAt?: string;
      readTime?: string;
      imageUrl?: string;
      featured?: boolean;
    };

    const category = (body.category || "").trim();
    const campus = (body.campus || "").trim();
    const title = (body.title || "").trim();
    const excerpt = (body.excerpt || "").trim();
    const publishedAt = (body.publishedAt || "").trim();
    const readTime = (body.readTime || "").trim() || "3 phút đọc";
    const imageUrl = (body.imageUrl || "").trim();
    const featured = Boolean(body.featured);

    const paragraphs = Array.isArray(body.content)
      ? body.content.map((p) => p.trim()).filter(Boolean)
      : (body.content || "")
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

    if (!category || !campus || !title || !excerpt || !publishedAt || !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Vui lòng điền đầy đủ Tiêu đề, Chuyên mục, Đơn vị, Ngày đăng, Tóm tắt và Ảnh bìa.",
        },
        { status: 400 }
      );
    }

    if (paragraphs.length === 0) {
      paragraphs.push(excerpt);
    }

    if (featured) {
      await db
        .update(newsArticles)
        .set({ featured: false })
        .where(ne(newsArticles.id, id));
    }

    const [updated] = await db
      .update(newsArticles)
      .set({
        category,
        campus,
        title,
        excerpt,
        content: paragraphs,
        publishedAt,
        readTime,
        imageUrl,
        featured,
        updatedAt: new Date(),
      })
      .where(eq(newsArticles.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 }
      );
    }

    revalidateTag(NEWS_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({
      article: {
        id: updated.id,
        category: updated.category,
        campus: updated.campus,
        title: updated.title,
        excerpt: updated.excerpt,
        content: updated.content,
        publishedAt: updated.publishedAt,
        readTime: updated.readTime,
        imageUrl: updated.imageUrl,
        featured: updated.featured,
      },
    });
  } catch (error) {
    console.error("Update news article error:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật bài viết." },
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
    await ensureNewsArticlesTable();
    const { id } = await context.params;

    const [deleted] = await db
      .delete(newsArticles)
      .where(eq(newsArticles.id, id))
      .returning({ id: newsArticles.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 }
      );
    }

    revalidateTag(NEWS_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("Delete news article error:", error);
    return NextResponse.json(
      { error: "Không thể xóa bài viết." },
      { status: 500 }
    );
  }
}
