import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR, contentTypeFor } from "@/lib/uploads";
import type { ReadStream } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sert /uploads/<...> depuis UPLOAD_DIR. En PROD, préférez une location nginx
// sur /uploads pour les vidéos (meilleur support du streaming).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  // Anti-traversal : on rejette tout ".." et on reste sous UPLOAD_DIR.
  const rel = parts.join("/");
  const filePath = path.normalize(path.join(UPLOAD_DIR, rel));
  if (!filePath.startsWith(UPLOAD_DIR) || rel.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  let size: number;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    size = s.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const type = contentTypeFor(filePath);
  const range = req.headers.get("range");

  // Requête Range (lecture/seek vidéo) -> 206 Partial Content.
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : size - 1;
    if (start >= size || end >= size) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const stream = createReadStream(filePath, { start, end });
    return new Response(toWeb(stream), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = createReadStream(filePath);
  return new Response(toWeb(stream), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// Node ReadStream -> Web ReadableStream
function toWeb(stream: ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: string | Buffer) =>
        controller.enqueue(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk)),
      );
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });
}
