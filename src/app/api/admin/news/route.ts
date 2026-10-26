import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { db, newsArticles } from "@/db";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import {
  NEWS_CACHE_TAG,
  ensureNewsArticlesTable,
  getAllNewsArticles,
} from "@/lib/news-store";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Chưa đăng nhập quản trị." },
      { status: 401 }
    );
  }

  const articles = await getAllNewsArticles();
  return NextResponse.json(
    { articles },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
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
    await ensureNewsArticlesTable();

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
      await db.update(newsArticles).set({ featured: false });
    }

    const [created] = await db
      .insert(newsArticles)
      .values({
        category,
        campus,
        title,
        excerpt,
        content: paragraphs,
        publishedAt,
        readTime,
        imageUrl,
        featured,
        sortOrder: 0,
      })
      .returning();

    revalidateTag(NEWS_CACHE_TAG, { expire: 0 });
    revalidatePath("/");

    return NextResponse.json({
      article: {
        id: created.id,
        category: created.category,
        campus: created.campus,
        title: created.title,
        excerpt: created.excerpt,
        content: created.content,
        publishedAt: created.publishedAt,
        readTime: created.readTime,
        imageUrl: created.imageUrl,
        featured: created.featured,
      },
    });
  } catch (error) {
    console.error("Create news article error:", error);
    return NextResponse.json(
      { error: "Không thể tạo bài viết mới." },
      { status: 500 }
    );
  }
}
