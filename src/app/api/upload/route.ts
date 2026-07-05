import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  UPLOAD_DIR,
  PHOTO_TYPES,
  VIDEO_TYPES,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string; guideId?: string | null } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const kind = String(form.get("kind") || "photo"); // "photo" | "video"
  const guideId = String(form.get("guideId") || user.guideId || "");
  if (!guideId) return NextResponse.json({ error: "guideId manquant" }, { status: 400 });

  // Un guide ne peut uploader que pour lui-même ; l'admin pour n'importe qui.
  if (user.role !== "admin" && user.guideId !== guideId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = kind === "video" ? VIDEO_TYPES : PHOTO_TYPES;
  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const dir = path.join(UPLOAD_DIR, guideId);
  await mkdir(dir, { recursive: true });

  const urls: { url: string; type: "photo" | "video" }[] = [];
  for (const file of files) {
    const ext = allowed[file.type];
    if (!ext) return NextResponse.json({ error: `Type non supporté: ${file.type}` }, { status: 415 });
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Fichier trop volumineux" }, { status: 413 });
    }
    const name = `${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    urls.push({ url: `/uploads/${guideId}/${name}`, type: kind === "video" ? "video" : "photo" });
  }

  return NextResponse.json({ ok: true, files: urls });
}
