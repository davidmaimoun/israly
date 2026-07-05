// Constantes d'upload — SANS import Node (utilisable côté client).
export const MAX_PHOTOS = 10;
export const MAX_VIDEOS = 3;

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 Mo
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80 Mo

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function contentTypeFor(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
