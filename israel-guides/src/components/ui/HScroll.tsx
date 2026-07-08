"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Scroller horizontal : les flèches n'apparaissent que si un défilement est possible.
// `pad` ajoute une marge intérieure (utile en pleine largeur pour aligner les bords).
export function HScroll({ children, pad = false, gapClass = "gap-4" }: { children: React.ReactNode; pad?: boolean; gapClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [fits, setFits] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = Math.abs(el.scrollLeft);
    setCanPrev(x > 1);
    setCanNext(x < max - 1);
    setFits(max <= 1); // le contenu tient -> on centre
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scroll = (toNext: boolean) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const amount = Math.min(el.clientWidth * 0.85, 560);
    const sign = toNext ? 1 : -1;
    el.scrollBy({ left: (rtl ? -sign : sign) * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canPrev && (
        <button
          type="button"
          onClick={() => scroll(false)}
          aria-label="Previous"
          className="absolute start-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-surface/95 p-2 text-ink shadow-[var(--shadow-soft)] ring-1 ring-stone transition hover:bg-surface md:block rtl:rotate-180"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div
        ref={ref}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          gapClass,
          fits ? "justify-center" : "",
          pad && "px-4 md:px-6",
        )}
      >
        {children}
      </div>
      {canNext && (
        <button
          type="button"
          onClick={() => scroll(true)}
          aria-label="Next"
          className="absolute end-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-surface/95 p-2 text-ink shadow-[var(--shadow-soft)] ring-1 ring-stone transition hover:bg-surface md:block rtl:rotate-180"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
