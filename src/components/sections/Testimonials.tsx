import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

// Placeholders — à remplacer par de vrais avis.
const ITEMS = [
  { name: "Sarah L.", city: "Paris", text: "Une journée inoubliable à Jérusalem, guide passionnant et trilingue !", side: "in" as const, color: "bg-primary" },
  { name: "David R.", city: "Lyon", text: "Organisation parfaite, du désert à la Mer Morte. Je recommande vivement.", side: "out" as const, color: "bg-secondary" },
  { name: "Noa B.", city: "Tel-Aviv", text: "מדריך מקצועי ואדיב, חוויה מושלמת לכל המשפחה.", side: "in" as const, color: "bg-coral" },
  { name: "Miguel A.", city: "Madrid", text: "Nuestro guía habló español todo el día. ¡Una experiencia increíble!", side: "out" as const, color: "bg-success" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function Testimonials() {
  const t = useTranslations("testimonials");
  return (
    <Section className="bg-surface">
      <Reveal>
        <h2 className="display mb-10 text-center text-3xl md:text-4xl">{t("title")}</h2>
      </Reveal>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {ITEMS.map((it, i) => {
          const incoming = it.side === "in";
          return (
            <Reveal key={it.name} delay={i * 160}>
              <div className={`flex items-end gap-2.5 ${incoming ? "" : "flex-row-reverse"}`}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-cream ${it.color}`}>
                  {initials(it.name)}
                </div>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                    incoming
                      ? "rounded-bl-md border border-stone/70 bg-cream"
                      : "rounded-br-md bg-primary text-cream"
                  }`}
                >
                  <p className={`mb-0.5 text-xs font-semibold ${incoming ? "text-secondary" : "text-cream/90"}`}>
                    {it.name} · <span className="font-normal opacity-80">{it.city}</span>
                  </p>
                  <p className={`text-sm leading-relaxed ${incoming ? "text-ink-soft" : "text-cream"}`}>{it.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
