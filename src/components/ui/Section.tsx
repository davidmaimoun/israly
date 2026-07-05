import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ParallaxBg } from "./ParallaxBg";

export function Section({
  id,
  children,
  className,
  bgImage,
  parallax = false,
  bgOpacity = 0.14,
  containerClassName,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bgImage?: string;
  parallax?: boolean;
  bgOpacity?: number;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-20 overflow-hidden py-14 md:py-20", className)}>
      {bgImage &&
        (parallax ? (
          <ParallaxBg src={bgImage} />
        ) : (
          // Texture fanée : au-dessus du fond de section, sous le contenu (z-0 vs z-10).
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})`, opacity: bgOpacity }}
          />
        ))}
      <div className={cn("relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
