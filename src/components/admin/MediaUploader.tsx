"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Upload, Trash2, Loader2, Film } from "lucide-react";
import type { Media } from "./GuideProfileForm";

// Upload + gestion d'une tranche de médias (photos OU vidéos).
export function MediaUploader({
  guideId,
  kind,
  max,
  items,
  onChange,
}: {
  guideId: string;
  kind: "photo" | "video";
  max: number;
  items: Media[];
  onChange: (items: Media[]) => void;
}) {
  const t = useTranslations("admin.profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - items.length;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, remaining);
    if (!picked.length) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("guideId", guideId);
      picked.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload échoué");
      const added: Media[] = data.files.map((f: { url: string }) => ({
        type: kind,
        url: f.url,
        poster: "",
        caption: "",
      }));
      onChange([...items, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const setCaption = (i: number, caption: string) =>
    onChange(items.map((m, idx) => (idx === i ? { ...m, caption } : m)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="eyebrow">
          {kind === "video" ? t("videosTitle") : t("photosTitle")}
        </label>
        <span className="text-xs text-ink-soft">
          {items.length}/{max}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {items.map((m, i) => (
          <div key={m.url + i} className="group relative overflow-hidden rounded-xl border border-stone bg-cream/40">
            <div className="relative aspect-square">
              {m.type === "video" ? (
                <video src={m.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <Image src={m.url} alt={m.caption || ""} fill sizes="120px" className="object-cover" />
              )}
              {m.type === "video" && (
                <span className="absolute start-1.5 top-1.5 rounded-full bg-ink/60 p-1 text-cream">
                  <Film size={12} />
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute end-1.5 top-1.5 rounded-full bg-ink/60 p-1 text-cream opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={t("remove")}
              >
                <Trash2 size={12} />
              </button>
            </div>
            <input
              value={m.caption ?? ""}
              onChange={(e) => setCaption(i, e.target.value)}
              placeholder={t("caption")}
              className="w-full border-t border-stone bg-surface px-2 py-1 text-[11px]"
            />
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone text-ink-soft hover:bg-sand disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            <span className="px-1 text-center text-[11px]">
              {busy ? t("uploading") : kind === "video" ? t("dropVideos") : t("dropPhotos")}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp"}
        multiple
        hidden
        onChange={onPick}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
