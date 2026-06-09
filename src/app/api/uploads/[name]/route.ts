import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, isAbsolute, basename, extname } from "node:path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Отдаёт сохранённый файл из UPLOAD_DIR (self-hosted-хранилище). Контент
// иммутабельный (имя = контент-хэш) → агрессивный кэш.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const safe = basename(name); // защита от path traversal
  if (!safe || safe !== name) {
    return new NextResponse("Not found", { status: 404 });
  }
  const dir = isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : join(process.cwd(), UPLOAD_DIR);
  try {
    const buf = await readFile(join(dir, safe));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[extname(safe).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
