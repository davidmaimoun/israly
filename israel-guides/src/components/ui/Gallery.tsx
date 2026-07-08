"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaItem = {
  type: "photo" | "video";
  url: string;
  poster?: string | null;
  caption?: string | null;
};

// Galerie masonry façon Pinterest/Insta + lightbox. Photos ET vidéos.
export function Gallery({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (!items?.length) return null;

  const close = () => setActive(null);
  const prev = () => setActive((i) => (i === null ? i : (i - 1 + items.length) % items.length));
  const next = () => setActive((i) => (i === null ? i : (i + 1) % items.length));

  return (
    <>
      {/* Grille carrée centrée, style Instagram. */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4">
        {items.map((m, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="group relative block aspect-square w-full overflow-hidden rounded-lg"
          >
            <Image
              src={m.type === "video" ? m.poster || m.url : m.url}
              alt={m.caption || ""}
              fill
              sizes="(max-width: 640px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {m.type === "video" && (
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/55 text-cream backdrop-blur">
                  <Play size={20} className="ms-0.5" />
                </span>
              </span>
            )}
            {m.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-start text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100">
                {m.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4"
          onClick={close}
        >
          <button
            className="absolute end-4 top-4 rounded-full bg-cream/10 p-2 text-cream hover:bg-cream/20"
            onClick={close}
            aria-label="Close"
          >
            <X />
          </button>
          {items.length > 1 && (
            <>
              <NavBtn side="start" onClick={(e) => { e.stopPropagation(); prev(); }}>
                <ChevronLeft />
              </NavBtn>
              <NavBtn side="end" onClick={(e) => { e.stopPropagation(); next(); }}>
                <ChevronRight />
              </NavBtn>
            </>
          )}
          <figure
            className="max-h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {items[active].type === "video" ? (
              <video
                src={items[active].url}
                poster={items[active].poster || undefined}
                controls
                autoPlay
                className="max-h-[80vh] rounded-xl"
              />
            ) : (
              <Image
                src={items[active].url}
                alt={items[active].caption || ""}
                width={1400}
                height={1000}
                className="max-h-[80vh] w-auto rounded-xl object-contain"
              />
            )}
            {items[active].caption && (
              <figcaption className="mt-3 text-center text-sm text-cream/80">
                {items[active].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}

function NavBtn({
  side,
  onClick,
  children,
}: {
  side: "start" | "end";
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-full bg-cream/10 p-2 text-cream hover:bg-cream/20",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      {children}
    </button>
  );
}
