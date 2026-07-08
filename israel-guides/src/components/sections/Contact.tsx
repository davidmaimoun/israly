import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Mail, MessageCircle } from "lucide-react";

export function Contact() {
  const t = useTranslations("contact");
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^0-9]/g, "");
  return (
    <Section id="contact" className="bg-gradient-to-br from-secondary to-ink text-cream">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display text-3xl md:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-cream/85">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-cream px-6 font-semibold text-secondary hover:brightness-95"
            >
              <MessageCircle size={18} /> {t("whatsapp")}
            </a>
            <a
              href="mailto:contact@example.com"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-cream/40 px-6 font-semibold text-cream hover:bg-cream/10"
            >
              <Mail size={18} /> {t("email")}
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
