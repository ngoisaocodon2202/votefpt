import { NextRequest } from "next/server";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, uploadedMedia } from "@/db";
import { ensureDatabaseInitialized } from "@/db/bootstrap";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connection();

  const { id: rawParam } = await context.params;
  // Support optional extension suffix e.g. `/api/media/<uuid>.webp`
  const mediaId = rawParam.split(".")[0]?.trim() || "";

  if (!UUID_REGEX.test(mediaId)) {
    return new Response("Invalid media ID", { status: 400 });
  }

  const etag = `"media-${mediaId}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  }

  try {
    await ensureDatabaseInitialized();

    const [row] = await db
      .select({
        mimeType: uploadedMedia.mimeType,
        dataBase64: uploadedMedia.dataBase64,
        filename: uploadedMedia.filename,
      })
      .from(uploadedMedia)
      .where(eq(uploadedMedia.id, mediaId))
      .limit(1);

    if (!row) {
      return new Response("Not Found", { status: 404 });
    }

    const binary = Buffer.from(row.dataBase64, "base64");

    return new Response(binary, {
      status: 200,
      headers: {
        "Content-Type": row.mimeType || "image/webp",
        "Content-Length": String(binary.byteLength),
        "Content-Disposition": `inline; filename="${row.filename}"`,
        ETag: etag,
        // Cached at Vercel Global Edge CDN for 1 year (immutable UUID)
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to serve uploaded media:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
