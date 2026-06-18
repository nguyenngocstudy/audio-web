import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const pattern = `%${q}%`;
    const rows = await db.execute(sql`
      SELECT id, title, author, genre, cover_url AS "coverUrl"
      FROM stories
      WHERE is_published = TRUE
        AND (
          title    ILIKE ${pattern} OR
          author   ILIKE ${pattern} OR
          narrator ILIKE ${pattern}
        )
      ORDER BY view_count DESC
      LIMIT 10
    `);
    return NextResponse.json(rows.rows);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json([]);
  }
}
