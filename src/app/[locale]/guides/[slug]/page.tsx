export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  MapPin, Award, Users, Moon, Clock, Accessibility, Utensils, BadgeCheck, Baby,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Gallery } from "@/components/ui/Gallery";
import { LanguageFlags } from "@/components/ui/LanguageFlags";
import { GuideBooking } from "@/components/guide/GuideBooking";
import { localized, fullName } from "@/lib/utils";
import type { TripUnit } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";

// Icône adaptée à une note (fallback: badge).
function noteIcon(n: string) {
  const s = n.toLowerCase();
  if (/shabbat|shabbos|chabbat/.test(s)) return Moon;
  if (/24\/7|24-7|24 ?7|always|available|dispo/.test(s)) return Clock;
  if (/family|kid|child|famille|enfant/.test(s)) return Baby;
  if (/wheelchair|accessib|handicap|fauteuil/.test(s)) return Accessibility;
  if (/kosher|casher|halal|food|meal|repas/.test(s)) return Utensils;
  if (/group|groupe/.test(s)) return Users;
  return BadgeCheck;
}

export default async function GuideProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const tc = await getTranslations("cities");
  const ts = await getTranslations("specialties");
  const tg = await getTranslations("guides");

  const guide = await prisma.guide.findFirst({ where: { slug, published: true } });
  if (!guide) notFound();

  const name = fullName(guide);
  const bio = localized(guide.bio, locale as Locale);
  const trips = guide.trips.map((tr) => ({
    label: tr.label,
    price: tr.price,
    unit: tr.unit as TripUnit,
    duration: tr.duration ?? null,
    details: tr.details ?? null,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        {/* En-tête : bandeau dégradé + photo qui déborde */}
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-stone/60 bg-surface shadow-[var(--shadow-soft)]">
          <div className="relative h-28 bg-gradient-to-br from-primary via-accent to-secondary md:h-36">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white, transparent 40%)" }} />
          </div>
          <div className="px-5 pb-6 md:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-4 ring-surface">
                <Image src={guide.photo || "/img/guide-placeholder.jpg"} alt={name} fill sizes="128px" className="object-cover" />
              </div>
              <div className="flex-1 sm:pb-2">
                <h1 className="display text-3xl md:text-4xl">{name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5"><MapPin size={15} className="text-primary" /> {tc(guide.city)}</span>
                  <span className="flex items-center gap-1.5"><Award size={15} className="text-primary" /> {tg("experience", { years: guide.yearsExperience })}</span>
                  <span className="flex items-center gap-1.5"><Users size={15} className="text-primary" /> {tg("tours", { count: guide.toursCompleted })}</span>
                </div>
              </div>
            </div>

            <div className="mt-4"><LanguageFlags codes={guide.languages} /></div>
            {guide.specialties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {guide.specialties.map((s) => (
                  <span key={s} className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-secondary">{ts(s)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* À propos */}
        {bio && (
          <section className="mt-6 rounded-[var(--radius-card)] border border-stone/60 bg-surface p-6 md:p-8">
            <h2 className="display mb-3 text-2xl">{t("about")}</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink-soft">{bio}</p>

            {/* Infos pratiques (notes) en pills avec icônes */}
            {guide.notes.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {guide.notes.map((n) => {
                  const Icon = noteIcon(n);
                  return (
                    <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-secondary">
                      <Icon size={15} className="text-primary" /> {n}
                    </span>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tours + tarifs + réservation */}
        <GuideBooking
          guideId={guide.id}
          firstName={guide.firstName}
          languages={guide.languages}
          currency={guide.currency}
          pricePerPersonHour={guide.pricePerPersonHour}
          pricePerGroup={guide.pricePerGroup}
          trips={trips}
        />

        {/* Galerie */}
        {guide.gallery.length > 0 && (
          <section className="mt-12">
            <h2 className="display mb-4 text-2xl">{t("gallery")}</h2>
            <Gallery items={guide.gallery} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
