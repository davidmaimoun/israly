"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURED_CITIES = ["jerusalem", "tel_aviv", "dead_sea", "galilee", "eilat", "nazareth"] as const;

export function PopularCities() {
  const t = useTranslations("popularCities");
  const tc = useTranslations("cities");

  const rowsRef = useRef<HTMLDivElement>(null);
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [ys, setYs] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState<boolean[]>([]);

  useEffect(() => {
    const measure = () => {
      const cont = rowsRef.current;
      if (!cont) return;
      const cr = cont.getBoundingClientRect();
      setW(cr.width);
      setH(cr.height);
      setYs(rowEls.current.map((el) => (el ? el.getBoundingClientRect().top - cr.top + el.getBoundingClientRect().height / 2 : 0)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rowsRef.current) ro.observe(rowsRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // Révèle chaque région quand elle entre dans l'écran (l'une après l'autre).
  useEffect(() => {
    const els = rowEls.current;
    const io = new IntersectionObserver(
      (entries) => {
        setInView((prev) => {
          const next = [...prev];
          entries.forEach((e) => {
            const idx = els.indexOf(e.target as HTMLDivElement);
            if (idx >= 0 && e.isIntersecting) next[idx] = true;
          });
          return next;
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cont = rowsRef.current;
        if (!cont) return;
        const r = cont.getBoundingClientRect();
        const p = (window.innerHeight * 0.62 - r.top) / r.height;
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [h]);

  const revealY = progress * h;

  // Trace desktop : serpentin léger passant par les centres de lignes.
  const dx = (i: number) => (i % 2 ? 0.54 : 0.46) * w;
  const desktopPath = ys.length
    ? ys.reduce((d, y, i) => {
        const x = dx(i);
        if (i === 0) return `M ${x} ${Math.max(0, y - 40)} L ${x} ${y}`;
        const py = ys[i - 1], px = dx(i - 1), my = (py + y) / 2;
        return `${d} C ${px} ${my} ${x} ${my} ${x} ${y}`;
      }, "")
    : "";

  // Trace mobile : ligne droite verticale, côté opposé au texte (à droite).
  const mx = Math.max(0, w - 22);
  const mobilePath = ys.length ? `M ${mx} ${Math.max(0, ys[0] - 30)} L ${mx} ${ys[ys.length - 1]}` : "";

  return (
    <section id="cities" className="relative scroll-mt-20 overflow-hidden bg-cream py-16 md:py-24">
      <div aria-hidden className="blob pointer-events-none absolute -right-24 top-16 h-72 w-72 bg-accent/25" />
      <div aria-hidden className="blob pointer-events-none absolute -left-24 bottom-24 h-64 w-64 bg-primary/12" style={{ animationDelay: "-4s" }} />

      <div className="relative z-10 mx-auto mb-14 max-w-6xl px-4 text-center md:px-6">
        <h2 className="display flex items-center justify-center gap-2 text-3xl md:text-4xl">
          <MapPin className="text-primary" size={28} /> {t("title")}
        </h2>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>
      </div>

      <div ref={rowsRef} className="relative z-10">
        {/* Traces (au-dessus des photos) */}
        {w > 0 && ys.length > 0 && (
          <svg className="pointer-events-none absolute inset-0 z-30" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
            <defs>
              <clipPath id="reg-reveal"><rect x="0" y="0" width={w} height={revealY} /></clipPath>
            </defs>
            {/* desktop */}
            <g className="hidden md:block">
              <path d={desktopPath} stroke="var(--color-stone)" strokeWidth="3" strokeDasharray="1 12" strokeLinecap="round" />
              <path d={desktopPath} stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="1 12" strokeLinecap="round" clipPath="url(#reg-reveal)" />
            </g>
            {/* mobile */}
            <g className="md:hidden">
              <path d={mobilePath} stroke="var(--color-stone)" strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round" />
              <path d={mobilePath} stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round" clipPath="url(#reg-reveal)" />
            </g>
          </svg>
        )}

        {/* Pins (desktop centrés sur le serpentin, mobile à droite) */}
        {ys.map((y, i) => {
          const reached = revealY >= y - 6;
          const base = "absolute z-40 -translate-x-1/2 -translate-y-1/2";
          const anim = reached ? "scale-100 opacity-100" : "scale-0 opacity-0";
          const style = { transition: "transform .5s cubic-bezier(.34,1.56,.64,1), opacity .3s" } as const;
          return (
            <div key={i}>
              <div className={cn(base, anim, "hidden md:block")} style={{ ...style, left: dx(i), top: y }}><Pin /></div>
              <div className={cn(base, anim, "md:hidden")} style={{ ...style, left: mx, top: y }}><Pin small /></div>
            </div>
          );
        })}

        {/* Lignes pleine largeur (photos collées au bord de l'écran) */}
        <div className="flex w-full flex-col">
          {FEATURED_CITIES.map((city, i) => {
            const flip = i % 2 === 1;
            const visible = inView[i];
            const revealPhoto = visible ? "opacity-100 translate-x-0" : cn("opacity-0", flip ? "translate-x-10" : "-translate-x-10");
            const revealText = visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6";
            return (
              <div
                key={city}
                ref={(el) => { rowEls.current[i] = el; }}
                className="relative grid items-stretch md:grid-cols-2"
              >
                <div className={cn("relative aspect-[16/10] overflow-hidden transition-all duration-[800ms] ease-out md:aspect-auto md:h-80", revealPhoto, flip && "md:order-2")}>
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{ backgroundImage: `url(https://picsum.photos/seed/ig-city-${city}/1000/700)` }} />
                  <div className={cn("absolute inset-0 from-transparent to-cream", flip ? "bg-gradient-to-l" : "bg-gradient-to-r")} />
                  <div className="absolute inset-0 bg-gradient-to-t from-cream/70 to-transparent md:hidden" />
                </div>

                <div
                  style={{ transitionDelay: visible ? "140ms" : "0ms" }}
                  className={cn("flex flex-col justify-center px-6 py-8 transition-all duration-700 ease-out md:px-14 md:py-0", revealText, flip ? "items-start md:order-1 md:items-end md:text-right" : "items-start")}
                >
                  <h3 className="display text-3xl md:text-4xl">{tc(city)}</h3>
                  <p className="mt-3 max-w-md text-ink-soft">{tc(`desc.${city}`)}</p>
                  <Link href={`/guides?cities=${city}`} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-accent/35">
                    <Compass size={15} /> {t("explore")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-14 text-center">
        <Link href="/guides" className="inline-flex items-center gap-1.5 rounded-full border border-stone px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary">
          <Compass size={16} /> {t("seeAll")}
        </Link>
      </div>
    </section>
  );
}

function Pin({ small = false }: { small?: boolean }) {
  const s = small ? "h-7 w-7" : "h-9 w-9";
  const dot = small ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className={cn("relative block rotate-45 rounded-full rounded-br-none bg-gradient-to-br from-primary to-secondary shadow-lg ring-4 ring-cream", s)}>
      <span className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-cream", dot)} />
    </span>
  );
}
