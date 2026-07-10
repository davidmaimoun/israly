"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, CalendarDays, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  const t = useTranslations("how");
  const rtl = useLocale() === "he";
  const steps = [
    { icon: Search, title: t("step1Title"), text: t("step1Text") },
    { icon: CalendarDays, title: t("step2Title"), text: t("step2Text") },
    { icon: Footprints, title: t("step3Title"), text: t("step3Text") },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Séquence : pop 1 (0) → trait 1 (300) → pop 2 (600) → trait 2 (900) → pop 3 (1200)
  const stepDelay = (i: number) => i * 600;
  const lineDelay = (i: number) => 300 + i * 600;

  return (
    <section id="how" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-cream via-surface to-cream py-14 md:py-20">
      {/* Ambiance douce : halo central + blobs colorés flottants et floutés */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 bg-accent/10" />
        <div className="blob absolute -left-24 top-8 h-72 w-72 bg-primary/15" />
        <div className="blob absolute -right-20 bottom-4 h-80 w-80 bg-secondary/15" style={{ animationDelay: "-6s" }} />
        <div className="blob absolute left-2/3 top-1/4 h-56 w-56 bg-accent/20" style={{ animationDelay: "-3s" }} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone/50 to-transparent" />
      <div ref={ref} className="relative z-10 mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="display mb-14 text-center text-3xl md:text-4xl">{t("title")}</h2>

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {/* Traits qui se tracent entre les étapes (desktop) */}
          <span
            aria-hidden
            className="absolute top-9 hidden h-0 origin-left border-t-2 border-dashed border-primary/45 transition-transform duration-500 ease-out md:block"
            style={{ left: rtl ? "50%" : "18%", right: rtl ? "18%" : "50%", transformOrigin: rtl ? "right" : "left", transform: on ? "scaleX(1)" : "scaleX(0)", transitionDelay: `${lineDelay(0)}ms` }}
          />
          <span
            aria-hidden
            className="absolute top-9 hidden h-0 origin-left border-t-2 border-dashed border-primary/45 transition-transform duration-500 ease-out md:block"
            style={{ left: rtl ? "18%" : "50%", right: rtl ? "50%" : "18%", transformOrigin: rtl ? "right" : "left", transform: on ? "scaleX(1)" : "scaleX(0)", transitionDelay: `${lineDelay(1)}ms` }}
          />

          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative flex flex-col items-center gap-3 text-center"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "scale(1)" : "scale(0.4)",
                transition: "transform .55s cubic-bezier(.34,1.56,.64,1), opacity .4s ease-out",
                transitionDelay: `${stepDelay(i)}ms`,
              }}
            >
              <div className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-surface shadow-[var(--shadow-soft)] ring-1 ring-stone">
                <s.icon size={28} className="text-primary" />
                <span className="absolute -end-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-bold text-cream">
                  {i + 1}
                </span>
              </div>
              <h3 className="display mt-2 text-xl">{s.title}</h3>
              <p className="max-w-xs text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}