"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Image de fond qui dérive au scroll. Respecte prefers-reduced-motion.
export function ParallaxBg({
  src,
  alt = "",
  overlay = true,
  speed = 0.25,
  imgClassName = "opacity-[0.55] [filter:sepia(0.25)_saturate(1.1)]",
  overlayClassName = "bg-gradient-to-b from-cream/40 via-cream/30 to-cream",
}: {
  src: string;
  alt?: string;
  overlay?: boolean;
  speed?: number;
  imgClassName?: string;
  overlayClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.15)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div ref={ref} className="absolute inset-0 will-change-transform">
        <Image src={src} alt={alt} fill priority sizes="100vw" className={`object-cover ${imgClassName}`} />
      </div>
      {overlay && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}
